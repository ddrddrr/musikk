from unittest.mock import MagicMock, patch

from django.test import TestCase

from streaming.managers.playback_manager import (
    ActivePlayback,
    PlaybackManager,
    PlaybackState,
)


class TestPlaybackManagerPlayInstanceUuid(TestCase):
    """
    `play_instance_uuid` is the FE's signal for "this is a new play of a song".

    Mints fresh on transitions that start a song from pos 0 (queue advance, picking
    a different song); preserved on pause/seek/sync. Lets the FE distinguish
    "same song queued multiple times in a row, advanced" from "no change" without
    relying on heuristics over song uuid + version.
    """

    USER_UUID = "11111111-1111-1111-1111-111111111111"

    def setUp(self):
        self.redis_patcher = patch(
            "streaming.managers.playback_manager.get_default_redis_conn"
        )
        self.mock_redis = MagicMock()
        self.mock_redis.get.return_value = None
        self.redis_patcher.start().return_value = self.mock_redis
        self.addCleanup(self.redis_patcher.stop)

        self.manager = PlaybackManager(self.USER_UUID)

    def _set_prev(self, prev: PlaybackState) -> None:
        self.mock_redis.get.return_value = self._serialize(prev)

    @staticmethod
    def _serialize(state: PlaybackState) -> str:
        import json

        return json.dumps(state.to_dict())

    @staticmethod
    def _state_with_active(active: ActivePlayback, version: int = 2) -> PlaybackState:
        return PlaybackState(active=active, version=version)

    def test_change_song_mints_new_uuid_even_when_song_uuid_unchanged(self):
        self._set_prev(
            self._state_with_active(
                ActivePlayback(
                    current_song_uuid="cs-1",
                    play_instance_uuid="prev-uuid",
                    is_playing=True,
                    last_known_song_pos_ms=10_000,
                    last_known_at_server_ms=0,
                )
            )
        )

        new_state = self.manager.transition_change_song("cs-1")

        self.assertIsNotNone(new_state.active)
        self.assertNotEqual(new_state.active.play_instance_uuid, "prev-uuid")

    def test_change_song_mints_new_uuid_for_different_song(self):
        self._set_prev(
            self._state_with_active(
                ActivePlayback(
                    current_song_uuid="cs-1",
                    play_instance_uuid="prev-uuid",
                    is_playing=True,
                    last_known_song_pos_ms=10_000,
                    last_known_at_server_ms=0,
                )
            )
        )

        new_state = self.manager.transition_change_song("cs-2")

        self.assertIsNotNone(new_state.active)
        self.assertNotEqual(new_state.active.play_instance_uuid, "prev-uuid")

    def test_start_playing_keeps_uuid_when_song_unchanged(self):
        self._set_prev(
            self._state_with_active(
                ActivePlayback(
                    current_song_uuid="cs-1",
                    play_instance_uuid="prev-uuid",
                    is_playing=False,
                    last_known_song_pos_ms=10_000,
                    last_known_at_server_ms=0,
                )
            )
        )

        new_state = self.manager.transition_start_playing("cs-1", 10_000)

        self.assertEqual(new_state.active.play_instance_uuid, "prev-uuid")

    def test_start_playing_mints_new_uuid_when_song_changes(self):
        self._set_prev(
            self._state_with_active(
                ActivePlayback(
                    current_song_uuid="cs-1",
                    play_instance_uuid="prev-uuid",
                    is_playing=False,
                    last_known_song_pos_ms=10_000,
                    last_known_at_server_ms=0,
                )
            )
        )

        new_state = self.manager.transition_start_playing("cs-2", 0)

        self.assertIsNotNone(new_state.active)
        self.assertNotEqual(new_state.active.play_instance_uuid, "prev-uuid")

    def test_pause_preserves_uuid(self):
        self._set_prev(
            self._state_with_active(
                ActivePlayback(
                    current_song_uuid="cs-1",
                    play_instance_uuid="prev-uuid",
                    is_playing=True,
                    last_known_song_pos_ms=10_000,
                    last_known_at_server_ms=0,
                )
            )
        )

        new_state = self.manager.transition_pause()

        self.assertEqual(new_state.active.play_instance_uuid, "prev-uuid")

    def test_seek_preserves_uuid(self):
        self._set_prev(
            self._state_with_active(
                ActivePlayback(
                    current_song_uuid="cs-1",
                    play_instance_uuid="prev-uuid",
                    is_playing=True,
                    last_known_song_pos_ms=10_000,
                    last_known_at_server_ms=0,
                )
            )
        )

        new_state = self.manager.transition_seek(42_500)

        self.assertEqual(new_state.active.play_instance_uuid, "prev-uuid")

    def test_sync_preserves_uuid(self):
        self._set_prev(
            self._state_with_active(
                ActivePlayback(
                    current_song_uuid="cs-1",
                    play_instance_uuid="prev-uuid",
                    is_playing=True,
                    last_known_song_pos_ms=10_000,
                    last_known_at_server_ms=0,
                )
            )
        )

        new_state = self.manager.transition_sync(11_000)

        self.assertEqual(new_state.active.play_instance_uuid, "prev-uuid")

    def test_two_consecutive_change_song_calls_produce_distinct_uuids(self):
        first = self.manager.transition_change_song("cs-1")
        self._set_prev(first)
        second = self.manager.transition_change_song("cs-1")

        self.assertNotEqual(
            first.active.play_instance_uuid, second.active.play_instance_uuid
        )


class TestPlaybackManagerEmptyState(TestCase):
    """
    Transitions that mutate an active playback (pause, seek, sync) are no-ops
    when there's no active state. Only `transition_start_playing` and
    `transition_change_song` are entry points into active playback.
    """

    USER_UUID = "33333333-3333-3333-3333-333333333333"

    def setUp(self):
        self.redis_patcher = patch(
            "streaming.managers.playback_manager.get_default_redis_conn"
        )
        self.mock_redis = MagicMock()
        self.mock_redis.get.return_value = None
        self.redis_patcher.start().return_value = self.mock_redis
        self.addCleanup(self.redis_patcher.stop)

        self.manager = PlaybackManager(self.USER_UUID)

    def test_pause_is_noop_when_no_active(self):
        result = self.manager.transition_pause()

        self.assertIsNone(result.active)
        self.mock_redis.set.assert_not_called()

    def test_seek_is_noop_when_no_active(self):
        result = self.manager.transition_seek(5_000)

        self.assertIsNone(result.active)
        self.mock_redis.set.assert_not_called()

    def test_sync_is_noop_when_no_active(self):
        result = self.manager.transition_sync(5_000)

        self.assertIsNone(result.active)
        self.mock_redis.set.assert_not_called()

    def test_start_playing_creates_active_from_empty(self):
        new_state = self.manager.transition_start_playing("cs-1", 0)

        self.assertIsNotNone(new_state.active)
        self.assertEqual(new_state.active.current_song_uuid, "cs-1")
        self.assertIsNotNone(new_state.active.play_instance_uuid)
