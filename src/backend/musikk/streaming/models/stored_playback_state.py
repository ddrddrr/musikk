import uuid
from collections.abc import Iterator
from contextlib import contextmanager

from base.models import BaseModel
from django.db import models, transaction
from utils.clock import now_server_ms

from streaming.models.collections import Collection
from streaming.models.playback_queue import QueueItem
from streaming.models.songs import CollectionSong

# so a song that is just ending, or audio that fell a few seconds behind the
# estimate, does not show as paused on the other tabs
PLAYING_PAST_END_MARGIN_MS = 30_000


class StoredPlaybackState(BaseModel):
    """Latest playback state data and an orchestrator around the Queue/CollectionCursor.

    Holds the song that is playing, the history cursor,
    and manages `PlaybackQueue` and `CollectionCursor` to decide what plays next.
    """

    current_collection_song = models.ForeignKey(
        "streaming.CollectionSong",
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    curr_play_item_unique_id = models.UUIDField(null=True, default=None)
    last_known_is_playing = models.BooleanField(default=False)
    # a standard integer field (32b) would overflow after about 25 days of a "playing" state
    last_known_song_pos_ms = models.PositiveBigIntegerField(default=0)
    last_known_song_pos_updated_at_server_ms = models.PositiveBigIntegerField(default=0)

    history_cursor = models.PositiveIntegerField(default=0)
    playback_queue = models.OneToOneField(
        "streaming.PlaybackQueue",
        on_delete=models.CASCADE,
    )
    collection_cursor = models.OneToOneField(
        "streaming.CollectionCursor",
        on_delete=models.CASCADE,
    )

    def play_song(self, collection_song: CollectionSong) -> None:
        with transaction.atomic():
            self._transition_to(collection_song)
            pos = (
                collection_song.position if collection_song.position is not None else -1
            )
            self.collection_cursor.setup(collection_song.collection, pos)
            self.save()

    def play_collection(self, collection: Collection) -> CollectionSong | None:
        """Returns the first song, or `None` for an empty collection.

        An empty collection leaves the row as it is.
        """
        first_song = (
            CollectionSong.objects.filter(collection=collection)
            .order_by("position")
            .first()
        )
        if not first_song:
            return None
        self.play_song(first_song)
        return first_song

    def advance(self) -> CollectionSong | None:
        """Move to the next song.

        Takes from the queue first, falls back to
        `collection_cursor.advance()` when the queue is empty
        (so user added items always win). Returns the new current
        song, or `None` when both are empty and playback stops.
        """
        with transaction.atomic():
            song = self.playback_queue.pop_first()
            if song:
                self._transition_to(song)
                self.save()
                return self.current_collection_song

            next_song = self.collection_cursor.advance()
            if next_song:
                self._transition_to(next_song)
                self.save()
                return self.current_collection_song

            self._transition_to(None)
            self.save()
            return None

    def choose_queue_song(self, item: QueueItem) -> CollectionSong | None:
        with transaction.atomic():
            self.playback_queue.pop_until(item.position)
            self._transition_to(item.collection_song)
            self.save()
            return self.current_collection_song

    def prev(self) -> CollectionSong | None:
        """Move to the previous song.

        Steps back through the user's history and pushes the
        current song to the front of the queue, so pressing next
        returns to it. Returns the new current song, or `None` if
        there is no older entry to go back to.
        """
        with transaction.atomic():
            history = self.streamingprofile.history
            entry = (
                CollectionSong.objects.filter(collection=history)
                .order_by("-position")[self.history_cursor : self.history_cursor + 1]
                .first()
            )

            if not entry:
                return None

            if self.current_collection_song:
                self.playback_queue.push_front(self.current_collection_song)

            self._set_current_song(entry)
            self.history_cursor += 1
            self.save()
            return self.current_collection_song

    def clear(self) -> None:
        """
        Clears the queue and resets the history cursor.

        The cursor must reset because `prev()` pushes the current
        song into the queue. If we cleared the queue but kept the
        cursor, the cursor could point past the most recent history
        entries, making them unreachable from `prev()`.
        """
        with transaction.atomic():
            self.playback_queue.clear()
            self.history_cursor = 0
            self.save()

    def is_empty(self) -> bool:
        return (
            self.current_collection_song is None
            and not QueueItem.objects.filter(queue=self.playback_queue).exists()
        )

    def has_curr_play_item(self) -> bool:
        return (
            self.current_collection_song_id is not None
            and self.curr_play_item_unique_id is not None
        )

    def is_playing(self) -> bool:
        if not self.has_curr_play_item() or not self.last_known_is_playing:
            return False
        return not self._is_past_song_end()

    def calculate_song_pos_ms(self) -> int:
        """Estimates the position in the current song right now.

        The stored position is old when someone reads it. While the song
        plays, the time passed since `last_known_song_pos_updated_at_server_ms` is
        added to it.
        """
        return self._estimate_song_pos_ms(self.is_playing())

    def apply_play_report(
        self, curr_play_item_unique_id: str, is_playing: bool, song_pos_ms: int
    ) -> bool:
        """Stores the play state and position that a device read from its audio element."""
        if (
            not self.has_curr_play_item()
            or str(self.curr_play_item_unique_id) != curr_play_item_unique_id
        ):
            return False
        self.last_known_is_playing = is_playing
        self.last_known_song_pos_ms = song_pos_ms
        self.last_known_song_pos_updated_at_server_ms = now_server_ms()
        self.save()
        return True

    def pause_at_estimated_position(self) -> None:
        """Used when the active device changes or disconnects,
        since there are no normal reports from the device anymore.
        """
        if not self.has_curr_play_item():
            return
        self.last_known_song_pos_ms = self.calculate_song_pos_ms()
        self.last_known_is_playing = False
        self.last_known_song_pos_updated_at_server_ms = now_server_ms()
        self.save()

    # TODO: not sure yet when to add to history - on switch to or on switch from
    def _transition_to(self, song: CollectionSong | None) -> None:
        self._add_to_history()
        self._set_current_song(song)
        self.history_cursor = 0

    def _set_current_song(self, song: CollectionSong | None) -> None:
        was_playing = self.is_playing()
        self.current_collection_song = song
        if song is None:
            self.curr_play_item_unique_id = None
            self.last_known_is_playing = False
            self.last_known_song_pos_ms = 0
            self.last_known_song_pos_updated_at_server_ms = 0
            return
        self.curr_play_item_unique_id = uuid.uuid4()
        self.last_known_is_playing = was_playing
        self.last_known_song_pos_ms = 0
        self.last_known_song_pos_updated_at_server_ms = now_server_ms()

    def _estimate_song_pos_ms(self, is_playing: bool) -> int:
        if not is_playing:
            return self.last_known_song_pos_ms
        return self.last_known_song_pos_ms + (
            now_server_ms() - self.last_known_song_pos_updated_at_server_ms
        )

    def _is_past_song_end(self) -> bool:
        duration_ms = self.current_collection_song.song.duration_ms
        if duration_ms is None:
            return False
        # not `is_playing()`, because `is_playing()` calls this method
        song_pos_ms = self._estimate_song_pos_ms(self.last_known_is_playing)
        return song_pos_ms > duration_ms + PLAYING_PAST_END_MARGIN_MS

    def _add_to_history(self) -> None:
        if not self.current_collection_song:
            return
        history = self.streamingprofile.history
        CollectionSong.objects.create(
            collection=history,
            song=self.current_collection_song.song,
        )


@contextmanager
def locked_stored_playback_state(user_uuid: str) -> Iterator[StoredPlaybackState]:
    """Locks and returns user's `StoredPlaybackState` db row.

    This is done, since, without it, race condition can arise when both HTTP and WebSocket callers change the playback data.
    """
    with transaction.atomic():
        yield StoredPlaybackState.objects.select_for_update(of=("self",)).get(
            streamingprofile__user__uuid=user_uuid
        )
