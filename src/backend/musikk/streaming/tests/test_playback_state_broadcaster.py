from unittest.mock import patch

from django.test import TestCase

from streaming.ws.state_broadcasters.playback import PlaybackStateBroadcaster
from streaming.ws.state_broadcasters.player import PlayerStateBroadcaster


class TestPlaybackStateBroadcaster(TestCase):
    USER_UUID = "22222222-2222-2222-2222-222222222222"

    def setUp(self):
        self.redis_patcher = patch(
            "streaming.managers.playback_manager.get_default_redis_conn"
        )
        self.broadcast_patcher = patch.object(PlayerStateBroadcaster, "broadcast_state")
        self.mock_redis = self.redis_patcher.start().return_value
        self.mock_broadcast = self.broadcast_patcher.start()

        self.addCleanup(self.redis_patcher.stop)
        self.addCleanup(self.broadcast_patcher.stop)

        self.broadcaster = PlaybackStateBroadcaster(user_uuid=self.USER_UUID)

    def test_activate_sets_redis_and_broadcasts_snapshot(self):
        self.broadcaster.activate()

        self.mock_redis.set.assert_called_once()
        args, _ = self.mock_redis.set.call_args
        self.assertTrue(args[0].endswith(":playback"))
        self.assertEqual(args[1], "true")
        self.mock_broadcast.assert_called_once_with()

    def test_stop_sets_redis_and_broadcasts_snapshot(self):
        self.broadcaster.stop()

        self.mock_redis.set.assert_called_once()
        args, _ = self.mock_redis.set.call_args
        self.assertTrue(args[0].endswith(":playback"))
        self.assertEqual(args[1], "false")
        self.mock_broadcast.assert_called_once_with()
