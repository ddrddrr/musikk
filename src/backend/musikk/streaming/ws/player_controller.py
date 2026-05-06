from decimal import Decimal

from django.contrib.auth import get_user_model
from websockets.event_helpers import send_ws_event, user_group

from streaming.managers.playback_manager import PlaybackManager
from streaming.models import Collection, PlayerState, QueueItem, SongQueue
from streaming.models.song_queue import POSITION_GAP
from streaming.models.songs import CollectionSong
from streaming.ws.events import ServerEvent
from streaming.ws.state_broadcasters.playback import PlaybackStateBroadcaster
from streaming.ws.state_broadcasters.player import PlayerStateBroadcaster


class PlayerController:
    """
    Centralizes the "global" player actions.
    E.g., on every player play_song command we need to clear the playback position, broadcast queue player change.
    """

    def __init__(self, user_uuid: str):
        self.user_uuid = user_uuid
        self._user = get_user_model().objects.get(uuid=user_uuid)
        self._playback_manager = PlaybackManager(user_uuid=user_uuid)
        self._player_broadcaster = PlayerStateBroadcaster(user_uuid=user_uuid)
        self._playback_broadcaster = PlaybackStateBroadcaster(user_uuid=user_uuid)

    def play_song(self, song: CollectionSong) -> None:
        self._player().play_song(song)
        self._sync_curr_play_state()

    def play_collection(self, collection: Collection) -> None:
        self._player().play_collection(collection)
        self._sync_curr_play_state()

    def clear(self) -> None:
        self._player().clear()
        self._sync_curr_play_state()

    def prev(self) -> None:
        player = self._player()
        if player.is_empty():
            return
        player.prev()
        self._sync_curr_play_state()

    def choose_queue_song(self, item: QueueItem) -> None:
        self._player().choose_queue_song(item)
        self._sync_curr_play_state()

    def advance(self) -> None:
        player = self._player()
        if player.is_empty():
            return
        if player.advance() is None:
            self._playback_broadcaster.stop()
            self._playback_manager.clear_position()
            self._broadcast_queue_changed()
            return
        self._sync_curr_play_state()

    def add_song_to_queue(self, song: CollectionSong) -> None:
        self._queue().insert(song)
        self._sync_queue_state()

    def add_collection_to_queue(self, collection: Collection) -> None:
        self._queue().insert(collection)
        self._sync_queue_state()

    # TODO: add play state sync here as well?
    def remove_queue_item(self, item: QueueItem) -> None:
        self._queue().remove(item)
        self._sync_queue_state()

    def reorder_queue(
        self,
        item: QueueItem,
        before: QueueItem | None = None,
        after: QueueItem | None = None,
    ) -> None:
        self._queue().reorder(item, before=before, after=after)
        self._sync_queue_state()

    def move_context_to_queue(
        self,
        collection_song: CollectionSong,
        before: QueueItem | None = None,
        after: QueueItem | None = None,
    ) -> None:
        player = self._player()
        position = self._resolve_insertion_position(player.queue, before, after)
        player.move_from_context_to_queue(collection_song, position)
        self._sync_queue_state()

    def _player(self) -> PlayerState:
        return self._user.streamingprofile.player

    def _queue(self) -> SongQueue:
        return self._player().queue

    def _sync_curr_play_state(self) -> None:
        self._playback_manager.clear_position()
        self._broadcast_queue_changed()
        self._player_broadcaster.broadcast_state()

    def _sync_queue_state(self) -> None:
        self._broadcast_queue_changed()

    def _broadcast_queue_changed(self) -> None:
        send_ws_event(user_group(self.user_uuid), ServerEvent.QUEUE_CHANGED)

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
