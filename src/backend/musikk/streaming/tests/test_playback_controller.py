from unittest.mock import patch

from django.test import TestCase

from streaming.managers.playback_manager import PlaybackManager, PlaybackState
from streaming.ws.playback_controller import PlaybackController
from streaming.ws.state_broadcasters.player import PlayerStateBroadcaster


class TestPlaybackController(TestCase):
    USER_UUID = "22222222-2222-2222-2222-222222222222"

    def setUp(self):
        self.transition_pause_patcher = patch.object(
            PlaybackManager, "transition_pause"
        )
        self.transition_start_patcher = patch.object(
            PlaybackManager, "transition_start_playing"
        )
        self.transition_seek_patcher = patch.object(PlaybackManager, "transition_seek")
        self.transition_sync_patcher = patch.object(PlaybackManager, "transition_sync")
        self.get_state_patcher = patch.object(PlaybackManager, "get_playback_state")
        self.broadcast_snapshot_patcher = patch.object(
            PlayerStateBroadcaster, "broadcast_snapshot"
        )
        self.broadcast_seek_patcher = patch.object(
            PlayerStateBroadcaster, "broadcast_seek"
        )

        self.mock_transition_pause = self.transition_pause_patcher.start()
        self.mock_transition_start = self.transition_start_patcher.start()
        self.mock_transition_seek = self.transition_seek_patcher.start()
        self.mock_transition_sync = self.transition_sync_patcher.start()
        self.mock_get_state = self.get_state_patcher.start()
        self.mock_broadcast_snapshot = self.broadcast_snapshot_patcher.start()
        self.mock_broadcast_seek = self.broadcast_seek_patcher.start()

        for p in (
            self.transition_pause_patcher,
            self.transition_start_patcher,
            self.transition_seek_patcher,
            self.transition_sync_patcher,
            self.get_state_patcher,
            self.broadcast_snapshot_patcher,
            self.broadcast_seek_patcher,
        ):
            self.addCleanup(p.stop)

        self.controller = PlaybackController(user_uuid=self.USER_UUID)

    def test_stop_pauses_and_broadcasts_snapshot(self):
        self.controller.stop()

        self.mock_transition_pause.assert_called_once_with()
        self.mock_broadcast_snapshot.assert_called_once_with()

    def test_activate_with_no_prev_state_starts_at_zero(self):
        self.mock_get_state.return_value = None

        self.controller.activate("cs-1")

        self.mock_transition_start.assert_called_once_with("cs-1", 0)
        self.mock_broadcast_snapshot.assert_called_once_with()

    def test_activate_with_prev_state_same_song_carries_anchor_forward(self):
        prev = PlaybackState(
            current_song_uuid="cs-1",
            is_playing=False,
            last_known_song_pos_ms=42_500,
            last_known_at_server_ms=1_700_000_000_000,
            version=2,
        )
        self.mock_get_state.return_value = prev

        with patch.object(PlaybackState, "calculate_song_pos_ms", return_value=42_500):
            self.controller.activate("cs-1")

        self.mock_transition_start.assert_called_once_with("cs-1", 42_500)
        self.mock_broadcast_snapshot.assert_called_once_with()

    def test_activate_with_prev_state_different_song_starts_at_zero(self):
        prev = PlaybackState(
            current_song_uuid="cs-other",
            is_playing=False,
            last_known_song_pos_ms=42_500,
            last_known_at_server_ms=1_700_000_000_000,
            version=2,
        )
        self.mock_get_state.return_value = prev

        self.controller.activate("cs-1")

        self.mock_transition_start.assert_called_once_with("cs-1", 0)
        self.mock_broadcast_snapshot.assert_called_once_with()

    def test_seek_transitions_and_broadcasts(self):
        self.controller.seek(12_500)

        self.mock_transition_seek.assert_called_once_with(12_500)
        self.mock_broadcast_seek.assert_called_once_with()

    def test_sync_below_threshold_only_transitions(self):
        prev = PlaybackState(
            current_song_uuid="cs-1",
            is_playing=True,
            last_known_song_pos_ms=12_100,
            last_known_at_server_ms=0,
            version=0,
        )

        with patch.object(PlaybackState, "calculate_song_pos_ms", return_value=12_100):
            self.controller.sync(12_000, prev)

        self.mock_transition_sync.assert_called_once_with(12_000)
        self.mock_broadcast_seek.assert_not_called()
        self.mock_broadcast_snapshot.assert_not_called()

    def test_sync_above_threshold_transitions_and_broadcasts_snapshot(self):
        prev = PlaybackState(
            current_song_uuid="cs-1",
            is_playing=True,
            last_known_song_pos_ms=5_000,
            last_known_at_server_ms=0,
            version=0,
        )

        with patch.object(PlaybackState, "calculate_song_pos_ms", return_value=5_000):
            self.controller.sync(12_000, prev)

        self.mock_transition_sync.assert_called_once_with(12_000)
        self.mock_broadcast_seek.assert_not_called()
        self.mock_broadcast_snapshot.assert_called_once_with()
