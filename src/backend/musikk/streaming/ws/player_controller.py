from decimal import Decimal

from django.contrib.auth import get_user_model

from streaming.managers.playback_manager import PlaybackManager
from streaming.models import Collection, QueueItem, SongQueue
from streaming.models.song_queue import POSITION_GAP
from streaming.models.songs import CollectionSong
from streaming.ws.state_broadcasters.player import PlayerStateBroadcaster


class PlayerController:
    """
    Centralizes the "global" player actions.
    E.g., on every player play_song command we need to clear the playback position, broadcast queue player change.
    """

    def __init__(self, user_uuid: str):
        self.user_uuid = user_uuid
        self._user = get_user_model().objects.get(uuid=user_uuid)
        self._player = self._user.streamingprofile.player
        self._playback_manager = PlaybackManager(user_uuid=user_uuid)
        self._player_broadcaster = PlayerStateBroadcaster(user_uuid=user_uuid)

    def play_song(self, song: CollectionSong) -> None:
        self._player.play_song(song)
        self._sync_curr_play_state()

    def play_collection(self, collection: Collection) -> None:
        self._player.play_collection(collection)
        self._sync_curr_play_state()

    def clear(self) -> None:
        self._player.clear()
        self._sync_curr_play_state()

    def prev(self) -> None:
        if self._player.is_empty():
            return
        self._player.prev()
        self._sync_curr_play_state()

    def choose_queue_song(self, item: QueueItem) -> None:
        self._player.choose_queue_song(item)
        self._sync_curr_play_state()

    def advance(self) -> None:
        if self._player.is_empty():
            return
        self._player.advance()
        self._sync_curr_play_state()

    def add_song_to_queue(self, song: CollectionSong) -> None:
        self._player.queue.insert(song)
        self._sync_queue_state()

    def add_collection_to_queue(self, collection: Collection) -> None:
        self._player.queue.insert(collection)
        self._sync_queue_state()

    # TODO: add play state sync here as well?
    def remove_queue_item(self, item: QueueItem) -> None:
        self._player.queue.remove(item)
        self._sync_queue_state()

    def reorder_queue(
        self,
        item: QueueItem,
        before: QueueItem | None = None,
        after: QueueItem | None = None,
    ) -> None:
        self._player.queue.reorder(item, before=before, after=after)
        self._sync_queue_state()

    def move_context_to_queue(
        self,
        collection_song: CollectionSong,
        before: QueueItem | None = None,
        after: QueueItem | None = None,
    ) -> None:
        position = self._resolve_insertion_position(self._player.queue, before, after)
        self._player.move_from_context_to_queue(collection_song, position)
        self._sync_queue_state()

    def _sync_curr_play_state(self) -> None:
        self._player.refresh_from_db(fields=["current_collection_song"])
        current = self._player.current_collection_song
        if current is None:
            self._playback_manager.clear_playback_state()
        else:
            self._playback_manager.transition_change_song(str(current.uuid))
        self._player_broadcaster.broadcast_queue_changed()
        self._player_broadcaster.broadcast_snapshot()

    def _sync_queue_state(self) -> None:
        self._player_broadcaster.broadcast_queue_changed()

    @staticmethod
    def _resolve_insertion_position(
        queue: SongQueue,
        before: QueueItem | None,
        after: QueueItem | None,
    ) -> Decimal:
        if before and after:
            return (before.position + after.position) / 2
        if before:
            return before.position + POSITION_GAP
        if after:
            return after.position - POSITION_GAP

        position = queue._calculate_append_position()
        queue.save()
        return position
