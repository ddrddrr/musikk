from unittest.mock import AsyncMock, MagicMock, patch

import msgpack
from django.test import TestCase
from users.tests.factories import BaseUserFactory

from streaming.models import StoredPlaybackState
from streaming.tests.factories import CollectionSongFactory
from streaming.ws.events import ServerEvent
from streaming.ws.state_broadcasters.playback import PlaybackStateBroadcaster

ACTIVE_DEVICE_ID = "active-device"


class TestPlaybackStateBroadcaster(TestCase):
    """
    Exercises broadcast_snapshot end-to-end (no class-level patches on PlaybackStateBroadcaster).

    Why: the WS handler tests mock broadcast_snapshot at the class level, which
    hides any regression in snapshot construction or serialization. If
    CollectionSongRetrieveSerializer ever requires HTTP-only context again,
    the mocked tests stay green while production crashes.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = BaseUserFactory.create()
        cls.collection_song = CollectionSongFactory.create(song__duration_ms=180_000)

    def setUp(self):
        self.stored_playback_state = StoredPlaybackState.objects.get(
            streamingprofile__user=self.user
        )
        self.now_server_ms_patcher = patch(
            "streaming.ws.state_broadcasters.playback.now_server_ms",
            return_value=1_700_000_000_000,
        )
        # `is_playing()` in the snapshot reads the clock in the model module
        self.model_now_server_ms_patcher = patch(
            "streaming.models.stored_playback_state.now_server_ms",
            return_value=1_700_000_000_000,
        )
        self.channel_layer_patcher = patch("websockets.event_helpers.get_channel_layer")
        self.device_manager_patcher = patch(
            "streaming.ws.state_broadcasters.playback.DeviceManager"
        )
        self.mock_now_server_ms = self.now_server_ms_patcher.start()
        self.model_now_server_ms_patcher.start()
        self.mock_channel_layer = MagicMock()
        self.mock_channel_layer.group_send = AsyncMock()
        self.mock_channel_layer.send = AsyncMock()
        self.channel_layer_patcher.start().return_value = self.mock_channel_layer
        self.mock_device_manager = self.device_manager_patcher.start().return_value
        self.mock_device_manager.get_active_device_id.return_value = ACTIVE_DEVICE_ID

        self.addCleanup(self.now_server_ms_patcher.stop)
        self.addCleanup(self.model_now_server_ms_patcher.stop)
        self.addCleanup(self.channel_layer_patcher.stop)
        self.addCleanup(self.device_manager_patcher.stop)

    def _set_playing_song(self, curr_play_item_unique_id: str, song_pos_ms: int):
        self.stored_playback_state.current_collection_song = self.collection_song
        self.stored_playback_state.curr_play_item_unique_id = curr_play_item_unique_id
        self.stored_playback_state.last_known_is_playing = True
        self.stored_playback_state.last_known_song_pos_ms = song_pos_ms
        self.stored_playback_state.last_known_song_pos_updated_at_server_ms = (
            1_700_000_000_000
        )
        self.stored_playback_state.save()

    def test_broadcast_snapshot_with_current_song_serializes_full_payload(self):
        self._set_playing_song("11111111-1111-1111-1111-111111111111", 12500)

        PlaybackStateBroadcaster(user_uuid=str(self.user.uuid)).broadcast_snapshot(
            self.stored_playback_state
        )

        self.mock_channel_layer.group_send.assert_called_once()
        args, _ = self.mock_channel_layer.group_send.call_args
        group_name, message = args
        self.assertEqual(group_name, f"user_{self.user.uuid}")
        self.assertEqual(message["event"], ServerEvent.PLAYBACK_SNAPSHOT)

        payload = message["payload"]
        self.assertEqual(
            set(payload.keys()),
            {"current_song", "server_ts_ms", "playback_state", "active_device_id"},
        )
        self.assertIsNotNone(payload["current_song"])
        self.assertEqual(
            payload["current_song"]["uuid"], str(self.collection_song.uuid)
        )
        self.assertIn("song", payload["current_song"])
        self.assertEqual(payload["server_ts_ms"], 1_700_000_000_000)
        self.assertEqual(
            payload["playback_state"],
            {
                "current_song_uuid": str(self.collection_song.uuid),
                "curr_play_item_unique_id": "11111111-1111-1111-1111-111111111111",
                "is_playing": True,
                "last_known_song_pos_ms": 12500,
                "last_known_song_pos_updated_at_server_ms": 1_700_000_000_000,
            },
        )
        self.assertEqual(payload["active_device_id"], ACTIVE_DEVICE_ID)

    def test_broadcast_snapshot_message_is_msgpack_serializable(self):
        """
        Regression: channels_redis serializes group messages with msgpack,
        which rejects UUID instances. Auto-generated relational fields on
        DRF serializers (e.g. CollectionSong.collection) emit raw UUID PKs,
        so the snapshot must be coerced before transport.
        """
        self._set_playing_song("33333333-3333-3333-3333-333333333333", 0)
        # a loaded row holds UUID instances, like the row from locked_stored_playback_state
        self.stored_playback_state.refresh_from_db()

        PlaybackStateBroadcaster(user_uuid=str(self.user.uuid)).broadcast_snapshot(
            self.stored_playback_state
        )

        args, _ = self.mock_channel_layer.group_send.call_args
        _, message = args
        msgpack.packb(message)

    def test_broadcast_snapshot_without_current_song_or_active_device_sends_nulls(
        self,
    ):
        self.mock_device_manager.get_active_device_id.return_value = None

        PlaybackStateBroadcaster(user_uuid=str(self.user.uuid)).broadcast_snapshot(
            self.stored_playback_state
        )

        args, _ = self.mock_channel_layer.group_send.call_args
        self.assertEqual(
            args[1]["payload"],
            {
                "current_song": None,
                "server_ts_ms": 1_700_000_000_000,
                "playback_state": None,
                "active_device_id": None,
            },
        )

    def test_send_set_command_to_channel_sends_to_that_channel_only(self):
        channel_layer = MagicMock()
        channel_layer.send = AsyncMock()

        broadcaster = PlaybackStateBroadcaster(user_uuid=str(self.user.uuid))
        broadcaster.send_set_command_to_channel(
            channel_layer,
            "active_channel",
            {"song_pos_ms": 42_500, "curr_play_item_unique_id": "pi-1"},
        )

        channel_layer.send.assert_called_once_with(
            "active_channel",
            {
                "type": "ws_event",
                "event": ServerEvent.PLAYBACK_SET,
                "payload": {"song_pos_ms": 42_500, "curr_play_item_unique_id": "pi-1"},
            },
        )
        self.mock_channel_layer.group_send.assert_not_called()

    def test_broadcast_queue_changed_emits_event(self):
        PlaybackStateBroadcaster(
            user_uuid=str(self.user.uuid)
        ).broadcast_queue_changed()

        self.mock_channel_layer.group_send.assert_called_once_with(
            f"user_{self.user.uuid}",
            {
                "type": "ws_event",
                "event": ServerEvent.QUEUE_CHANGED,
                "payload": {},
            },
        )
