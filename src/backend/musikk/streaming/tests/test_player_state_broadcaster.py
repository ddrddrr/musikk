from unittest.mock import AsyncMock, MagicMock, patch

import msgpack
from django.test import TestCase
from users.tests.factories import BaseUserFactory

from streaming.managers.playback_manager import (
    ActivePlayback,
    PlaybackManager,
    PlaybackState,
)
from streaming.tests.factories import CollectionSongFactory
from streaming.ws.events import ServerEvent
from streaming.ws.state_broadcasters.player import PlayerStateBroadcaster


class TestPlayerStateBroadcaster(TestCase):
    """
    Exercises broadcast_snapshot end-to-end (no class-level patches on PlayerStateBroadcaster).

    Why: the WS handler tests mock broadcast_snapshot at the class level, which
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
        self.get_playback_state_patcher = patch.object(
            PlaybackManager, "get_playback_state", return_value=None
        )
        self.now_server_ms_patcher = patch(
            "streaming.ws.state_broadcasters.player.now_server_ms",
            return_value=1_700_000_000_000,
        )
        self.channel_layer_patcher = patch("websockets.event_helpers.get_channel_layer")
        self.mock_get_playback_state = self.get_playback_state_patcher.start()
        self.mock_now_server_ms = self.now_server_ms_patcher.start()
        self.mock_channel_layer = MagicMock()
        self.mock_channel_layer.group_send = AsyncMock()
        self.mock_channel_layer.send = AsyncMock()
        self.channel_layer_patcher.start().return_value = self.mock_channel_layer

        self.addCleanup(self.get_playback_state_patcher.stop)
        self.addCleanup(self.now_server_ms_patcher.stop)
        self.addCleanup(self.channel_layer_patcher.stop)

    def _set_current_song(self):
        player = self.user.streamingprofile.player
        player.current_collection_song = self.collection_song
        player.save(update_fields=["current_collection_song"])

    def test_broadcast_snapshot_with_current_song_serializes_full_payload(self):
        self._set_current_song()
        self.mock_get_playback_state.return_value = PlaybackState(
            active=ActivePlayback(
                current_song_uuid=str(self.collection_song.uuid),
                play_instance_uuid="11111111-1111-1111-1111-111111111111",
                is_playing=True,
                last_known_song_pos_ms=12500,
                last_known_at_server_ms=1_700_000_000_000,
            ),
            version=3,
        )

        PlayerStateBroadcaster(user_uuid=str(self.user.uuid)).broadcast_snapshot()

        self.mock_channel_layer.group_send.assert_called_once()
        args, _ = self.mock_channel_layer.group_send.call_args
        group_name, message = args
        self.assertEqual(group_name, f"user_{self.user.uuid}")
        self.assertEqual(message["event"], ServerEvent.PLAYBACK_SNAPSHOT)

        payload = message["payload"]
        self.assertEqual(
            set(payload.keys()),
            {"current_song", "server_ts_ms", "playback_state"},
        )
        self.assertIsNotNone(payload["current_song"])
        self.assertEqual(
            payload["current_song"]["uuid"], str(self.collection_song.uuid)
        )
        self.assertIn("song", payload["current_song"])
        self.assertEqual(payload["server_ts_ms"], 1_700_000_000_000)
        self.assertEqual(payload["playback_state"]["version"], 3)
        active = payload["playback_state"]["active"]
        self.assertEqual(active["last_known_song_pos_ms"], 12500)
        self.assertTrue(active["is_playing"])
        self.assertEqual(
            active["play_instance_uuid"],
            "11111111-1111-1111-1111-111111111111",
        )

    def test_broadcast_snapshot_message_is_msgpack_serializable(self):
        """
        Regression: channels_redis serializes group messages with msgpack,
        which rejects UUID instances. Auto-generated relational fields on
        DRF serializers (e.g. CollectionSong.collection) emit raw UUID PKs,
        so the snapshot must be coerced before transport.
        """
        self._set_current_song()
        self.mock_get_playback_state.return_value = PlaybackState(
            active=ActivePlayback(
                current_song_uuid=str(self.collection_song.uuid),
                play_instance_uuid="33333333-3333-3333-3333-333333333333",
                is_playing=True,
                last_known_song_pos_ms=0,
                last_known_at_server_ms=1_700_000_000_000,
            ),
            version=1,
        )

        PlayerStateBroadcaster(user_uuid=str(self.user.uuid)).broadcast_snapshot()

        args, _ = self.mock_channel_layer.group_send.call_args
        _, message = args
        msgpack.packb(message)

    def test_broadcast_snapshot_without_current_song_returns_null(self):
        self.mock_get_playback_state.return_value = None

        PlayerStateBroadcaster(user_uuid=str(self.user.uuid)).broadcast_snapshot()

        args, _ = self.mock_channel_layer.group_send.call_args
        payload = args[1]["payload"]
        self.assertIsNone(payload["current_song"])
        self.assertIsNone(payload["playback_state"])

    def test_broadcast_seek_emits_seek_event_with_playback_state(self):
        self.mock_get_playback_state.return_value = PlaybackState(
            active=ActivePlayback(
                current_song_uuid=str(self.collection_song.uuid),
                play_instance_uuid="22222222-2222-2222-2222-222222222222",
                is_playing=True,
                last_known_song_pos_ms=42_500,
                last_known_at_server_ms=1_700_000_000_000,
            ),
            version=4,
        )

        PlayerStateBroadcaster(user_uuid=str(self.user.uuid)).broadcast_seek()

        self.mock_channel_layer.group_send.assert_called_once_with(
            f"user_{self.user.uuid}",
            {
                "type": "ws_event",
                "event": ServerEvent.PLAYBACK_SEEK,
                "payload": {
                    "server_ts_ms": 1_700_000_000_000,
                    "playback_state": {
                        "active": {
                            "current_song_uuid": str(self.collection_song.uuid),
                            "play_instance_uuid": "22222222-2222-2222-2222-222222222222",
                            "is_playing": True,
                            "last_known_song_pos_ms": 42_500,
                            "last_known_at_server_ms": 1_700_000_000_000,
                        },
                        "version": 4,
                    },
                },
            },
        )

    def test_broadcast_queue_changed_emits_event(self):
        PlayerStateBroadcaster(user_uuid=str(self.user.uuid)).broadcast_queue_changed()

        self.mock_channel_layer.group_send.assert_called_once_with(
            f"user_{self.user.uuid}",
            {
                "type": "ws_event",
                "event": ServerEvent.QUEUE_CHANGED,
                "payload": {},
            },
        )
