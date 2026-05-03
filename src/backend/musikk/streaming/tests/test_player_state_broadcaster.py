from unittest.mock import AsyncMock, MagicMock, patch

from django.test import TestCase
from users.tests.factories import BaseUserFactory

from streaming.events import ServerEvent
from streaming.state_broadcasters.player import PlayerStateBroadcaster
from streaming.tests.factories import CollectionSongFactory


class TestPlayerStateBroadcaster(TestCase):
    """
    Exercises broadcast_state end-to-end (no class-level patches on PlayerStateBroadcaster).

    Why: the WS handler tests mock broadcast_state at the class level, which
    hides any regression in snapshot construction or serialization. If
    CollectionSongRetrieveSerializer ever requires HTTP-only context again,
    the mocked tests stay green while production crashes.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = BaseUserFactory.create()
        cls.collection_song = CollectionSongFactory.create()

    def setUp(self):
        self.redis_patcher = patch(
            "streaming.managers.playback_manager.get_default_redis_conn"
        )
        self.channel_layer_patcher = patch("websockets.event_helpers.get_channel_layer")
        self.mock_redis = self.redis_patcher.start().return_value
        self.mock_channel_layer = MagicMock()
        self.mock_channel_layer.group_send = AsyncMock()
        self.mock_channel_layer.send = AsyncMock()
        self.channel_layer_patcher.start().return_value = self.mock_channel_layer

        self.addCleanup(self.redis_patcher.stop)
        self.addCleanup(self.channel_layer_patcher.stop)

    def _set_current_song(self):
        player = self.user.streamingprofile.player
        player.current_collection_song = self.collection_song
        player.save(update_fields=["current_collection_song"])

    def test_broadcast_state_with_current_song_serializes_full_payload(self):
        self._set_current_song()
        self.mock_redis.get.return_value = b"true"

        PlayerStateBroadcaster(user_uuid=str(self.user.uuid)).broadcast_state()

        self.mock_channel_layer.group_send.assert_called_once()
        args, _ = self.mock_channel_layer.group_send.call_args
        group_name, message = args
        self.assertEqual(group_name, f"user_{self.user.uuid}")
        self.assertEqual(message["event"], ServerEvent.PLAYBACK_SNAPSHOT)

        payload = message["payload"]
        self.assertEqual(
            set(payload.keys()),
            {"current_song", "is_playback_active", "position"},
        )
        self.assertIsNotNone(payload["current_song"])
        self.assertEqual(
            payload["current_song"]["uuid"], str(self.collection_song.uuid)
        )
        self.assertIn("song", payload["current_song"])
        # is_liked must serialize without an HTTP request in context
        self.assertIn("is_liked", payload["current_song"]["song"])
        self.assertEqual(payload["current_song"]["song"]["is_liked"], False)

    def test_broadcast_state_without_current_song_returns_null(self):
        self.mock_redis.get.return_value = None

        PlayerStateBroadcaster(user_uuid=str(self.user.uuid)).broadcast_state()

        args, _ = self.mock_channel_layer.group_send.call_args
        payload = args[1]["payload"]
        self.assertIsNone(payload["current_song"])
        self.assertFalse(payload["is_playback_active"])

    def test_broadcast_state_forces_inactive_when_current_song_is_null(self):
        # the redis flag can outlive the song; snapshot must reconcile to
        # is_playback_active=False so the FE play button doesn't get stuck in Pause
        self.mock_redis.get.return_value = b"true"

        PlayerStateBroadcaster(user_uuid=str(self.user.uuid)).broadcast_state()

        args, _ = self.mock_channel_layer.group_send.call_args
        payload = args[1]["payload"]
        self.assertIsNone(payload["current_song"])
        self.assertFalse(payload["is_playback_active"])

    def test_build_snapshot_omits_position_when_disabled(self):
        self.mock_redis.get.return_value = None
        broadcaster = PlayerStateBroadcaster(user_uuid=str(self.user.uuid))

        snapshot = broadcaster.build_snapshot(include_position=False)

        self.assertIsNone(snapshot["position"])
