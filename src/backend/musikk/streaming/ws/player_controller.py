from django.db import transaction

from streaming.models import Collection, QueueItem, StoredPlaybackState
from streaming.models.songs import CollectionSong
from streaming.models.stored_playback_state import locked_stored_playback_state
from streaming.ws.state_broadcasters.playback import PlaybackStateBroadcaster


class PlayerController:
    """
    Centralizes the "global" player actions.
    E.g., on every player `play_song` command we need to clear the playback position and broadcast queue player change.
    """

    def __init__(self, user_uuid: str):
        self.user_uuid = user_uuid
        self._playback_state_broadcaster = PlaybackStateBroadcaster(user_uuid=user_uuid)

    def play_song(self, song: CollectionSong) -> None:
        with locked_stored_playback_state(self.user_uuid) as stored_playback_state:
            stored_playback_state.play_song(song)
            self._broadcast_song_change(stored_playback_state)

    def play_collection(self, collection: Collection) -> None:
        with locked_stored_playback_state(self.user_uuid) as stored_playback_state:
            if stored_playback_state.play_collection(collection) is None:
                return
            self._broadcast_song_change(stored_playback_state)

    def clear(self) -> None:
        with locked_stored_playback_state(self.user_uuid) as stored_playback_state:
            stored_playback_state.clear()
            self._sync_queue_state()

    def prev(self) -> None:
        with locked_stored_playback_state(self.user_uuid) as stored_playback_state:
            if stored_playback_state.is_empty():
                return
            if stored_playback_state.prev() is None:
                return
            self._broadcast_song_change(stored_playback_state)

    def choose_queue_song(self, item: QueueItem) -> None:
        with locked_stored_playback_state(self.user_uuid) as stored_playback_state:
            stored_playback_state.choose_queue_song(item)
            self._broadcast_song_change(stored_playback_state)

    def advance(self) -> None:
        with locked_stored_playback_state(self.user_uuid) as stored_playback_state:
            if stored_playback_state.is_empty():
                return
            stored_playback_state.advance()
            self._broadcast_song_change(stored_playback_state)

    def add_song_to_queue(self, song: CollectionSong) -> None:
        with locked_stored_playback_state(self.user_uuid) as stored_playback_state:
            stored_playback_state.playback_queue.append(song)
            self._sync_queue_state()

    def add_collection_to_queue(self, collection: Collection) -> None:
        with locked_stored_playback_state(self.user_uuid) as stored_playback_state:
            stored_playback_state.playback_queue.append(collection)
            self._sync_queue_state()

    # TODO: add play state sync here as well?
    def remove_queue_item(self, item: QueueItem) -> None:
        with locked_stored_playback_state(self.user_uuid) as stored_playback_state:
            stored_playback_state.playback_queue.remove(item)
            self._sync_queue_state()

    def reorder_queue(
        self,
        item: QueueItem,
        before: QueueItem | None = None,
        after: QueueItem | None = None,
    ) -> None:
        with locked_stored_playback_state(self.user_uuid) as stored_playback_state:
            stored_playback_state.playback_queue.reorder(
                item, before=before, after=after
            )
            self._sync_queue_state()

    def _broadcast_song_change(
        self, stored_playback_state: StoredPlaybackState
    ) -> None:
        """Sends the new snapshot and tells the tabs to refetch the queue.

        A song change also changes what the queue view shows. It takes items from
        the queue or the collection, or pushes the old song back into the queue.
        """
        self._sync_queue_state()
        self._playback_state_broadcaster.broadcast_snapshot(stored_playback_state)

    def _sync_queue_state(self) -> None:
        # the tabs refetch the queue over HTTP on this event, and before the
        # commit that request would still read the old queue
        transaction.on_commit(self._playback_state_broadcaster.broadcast_queue_changed)
