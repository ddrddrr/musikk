from unittest.mock import patch
from uuid import UUID

from django.test import TestCase
from users.tests.factories import BaseUserFactory
from utils.clock import now_server_ms

from streaming.models import StoredPlaybackState
from streaming.tests.factories import CollectionFactory, CollectionSongFactory
from streaming.ws.player_controller import PlayerController
from streaming.ws.state_broadcasters.playback import PlaybackStateBroadcaster

OLD_PLAY_ITEM_UNIQUE_ID = "22222222-2222-2222-2222-222222222222"


class TestPlayerControllerSongChange(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = BaseUserFactory.create()
        cls.current_song = CollectionSongFactory.create(song__duration_ms=600_000)
        cls.next_song = CollectionSongFactory.create(song__duration_ms=60_000)

    def setUp(self):
        self.broadcast_snapshot_patcher = patch.object(
            PlaybackStateBroadcaster, "broadcast_snapshot"
        )
        self.broadcast_queue_changed_patcher = patch.object(
            PlaybackStateBroadcaster, "broadcast_queue_changed"
        )
        self.mock_broadcast_snapshot = self.broadcast_snapshot_patcher.start()
        self.mock_broadcast_queue_changed = self.broadcast_queue_changed_patcher.start()
        self.addCleanup(self.broadcast_snapshot_patcher.stop)
        self.addCleanup(self.broadcast_queue_changed_patcher.stop)

        stored_playback_state = self._load_stored_playback_state()
        stored_playback_state.current_collection_song = self.current_song
        stored_playback_state.curr_play_item_unique_id = OLD_PLAY_ITEM_UNIQUE_ID
        stored_playback_state.last_known_is_playing = True
        stored_playback_state.last_known_song_pos_ms = 300_000
        stored_playback_state.last_known_song_pos_updated_at_server_ms = now_server_ms()
        stored_playback_state.save()
        stored_playback_state.playback_queue.append(self.next_song)

        self.controller = PlayerController(user_uuid=str(self.user.uuid))

    def _load_stored_playback_state(self) -> StoredPlaybackState:
        return StoredPlaybackState.objects.get(streamingprofile__user=self.user)

    def test_advance_writes_a_new_play_item_and_sends_queue_changed_on_commit(
        self,
    ):
        with self.captureOnCommitCallbacks(execute=True):
            self.controller.advance()

            # the snapshot is sent under the lock, the queue event waits for
            # the commit, because the tabs refetch the queue when they get it
            self.mock_broadcast_snapshot.assert_called_once()
            self.mock_broadcast_queue_changed.assert_not_called()

        stored_playback_state = self._load_stored_playback_state()
        self.assertEqual(stored_playback_state.current_collection_song, self.next_song)
        self.assertIsNotNone(stored_playback_state.curr_play_item_unique_id)
        self.assertNotEqual(
            stored_playback_state.curr_play_item_unique_id,
            UUID(OLD_PLAY_ITEM_UNIQUE_ID),
        )
        self.assertEqual(stored_playback_state.last_known_song_pos_ms, 0)
        self.mock_broadcast_snapshot.assert_called_once_with(stored_playback_state)
        self.mock_broadcast_queue_changed.assert_called_once_with()

    def test_advance_keeps_playing_when_the_old_position_is_past_the_next_song_end(
        self,
    ):
        # the play state is read before the song changes, so the 5 min position
        # is not compared with the 1 min length of the next song
        self.controller.advance()

        self.assertTrue(self._load_stored_playback_state().is_playing())

    def test_play_empty_collection_keeps_the_current_play_item(self):
        self.controller.play_collection(CollectionFactory.create(songs__songs_count=0))

        stored_playback_state = self._load_stored_playback_state()
        self.assertEqual(
            stored_playback_state.curr_play_item_unique_id,
            UUID(OLD_PLAY_ITEM_UNIQUE_ID),
        )
        self.assertEqual(stored_playback_state.last_known_song_pos_ms, 300_000)
        self.mock_broadcast_snapshot.assert_not_called()

    def test_prev_without_history_keeps_the_current_play_item(self):
        self.controller.prev()

        stored_playback_state = self._load_stored_playback_state()
        self.assertEqual(
            stored_playback_state.curr_play_item_unique_id,
            UUID(OLD_PLAY_ITEM_UNIQUE_ID),
        )
        self.assertEqual(stored_playback_state.last_known_song_pos_ms, 300_000)
        self.mock_broadcast_snapshot.assert_not_called()
