from unittest.mock import AsyncMock, MagicMock, Mock, patch

from django.test import TestCase
from social.ws import TypingWSActionHandler
from streaming.audio.config import MAX_DURATION_SECONDS
from streaming.models import StoredPlaybackState
from streaming.tests.factories import CollectionSongFactory
from streaming.ws.action_handlers.device import DeviceWSActionHandler
from streaming.ws.action_handlers.playback import PlaybackWSActionHandler
from streaming.ws.events import ServerEvent
from streaming.ws.state_broadcasters.device import DeviceStateBroadcaster
from streaming.ws.state_broadcasters.playback import PlaybackStateBroadcaster
from users.tests.factories import BaseUserFactory

from websockets.action_handler import WSActionHandler
from websockets.base_consumer import BaseConsumer
from websockets.topics import TOPIC_VALIDATORS, TopicWSActionHandler

PLAY_ITEM_UNIQUE_ID = "11111111-1111-1111-1111-111111111111"
OLD_PLAY_ITEM_UNIQUE_ID = "22222222-2222-2222-2222-222222222222"


def _make_consumer(user):
    mock_channel_layer = MagicMock()
    mock_channel_layer.group_add = AsyncMock()
    mock_channel_layer.group_discard = AsyncMock()
    mock_channel_layer.group_send = AsyncMock()
    mock_channel_layer.send = AsyncMock()

    consumer = BaseConsumer()
    consumer.scope = {"user": user}
    consumer.channel_name = "test_channel"
    consumer.channel_layer = mock_channel_layer
    consumer.accept = Mock()
    consumer.close = Mock()
    consumer.send_json = Mock()
    return consumer


class TestBaseConsumer(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = BaseUserFactory.create()

    def setUp(self):
        self.consumer = _make_consumer(self.user)

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_connect_authenticated_user(self, mock_device):
        self.consumer.connect()

        self.assertIsNotNone(self.consumer.user)
        self.assertEqual(self.consumer.user, self.user)
        self.assertEqual(self.consumer.user_uuid, str(self.user.uuid))
        self.assertEqual(self.consumer.group_name, f"user_{self.user.uuid}")

        self.consumer.accept.assert_called_once()
        self.consumer.channel_layer.group_add.assert_called_once_with(
            f"user_{self.user.uuid}", "test_channel"
        )

        mock_device.assert_called_once_with(user_uuid=str(self.user.uuid))

        self.assertEqual(
            set(self.consumer._action_map.keys()),
            {
                "device.register",
                "device.set_active",
                "device.set_volume",
                "playback.set",
                "playback.active-device-report",
                "subscribe",
                "unsubscribe",
                "typing",
            },
        )

    def test_connect_anonymous_user(self):
        anonymous_user = Mock()
        anonymous_user.is_anonymous = True

        consumer = _make_consumer(anonymous_user)
        consumer.connect()

        consumer.accept.assert_not_called()

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_connect_group_add_failure_returns_early(self, _mock_device):
        self.consumer.channel_layer.group_add = AsyncMock(
            side_effect=Exception("redis down")
        )

        self.consumer.connect()

        self.consumer.accept.assert_not_called()
        self.assertEqual(self.consumer._action_map, {})

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_connect_raises_on_action_collision(self, _mock_device):
        class DuplicateHandler(WSActionHandler):
            def get_actions(self):
                return {"device.register": lambda p: None}

        self.consumer.action_handler_classes = [DeviceWSActionHandler, DuplicateHandler]

        with self.assertRaises(ValueError):
            self.consumer.connect()

    def test_receive_json_missing_action(self):
        self.consumer.user = self.user

        self.consumer.receive_json({"payload": {}})
        self.consumer.send_json.assert_called_once_with(
            {
                "event": "error",
                "payload": {"message": "Missing 'action' field"},
            }
        )

    def test_receive_json_unknown_action(self):
        self.consumer.user = self.user
        self.consumer._action_map = {}

        self.consumer.receive_json({"action": "foo.bar"})
        self.consumer.send_json.assert_called_once_with(
            {
                "event": "error",
                "payload": {"message": "Unknown action: foo.bar"},
            }
        )

    def test_receive_json_dispatches_to_handler(self):
        handler_fn = Mock()
        self.consumer._action_map = {"test.action": handler_fn}

        self.consumer.receive_json(
            {"action": "test.action", "payload": {"key": "value"}}
        )

        handler_fn.assert_called_once_with({"key": "value"})
        self.consumer.send_json.assert_not_called()

    def test_receive_json_dispatches_with_empty_payload(self):
        handler_fn = Mock()
        self.consumer._action_map = {"test.action": handler_fn}

        self.consumer.receive_json({"action": "test.action"})

        handler_fn.assert_called_once_with({})

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_disconnect_discards_group_and_calls_handlers(self, _mock_device):
        self.consumer.connect()
        self.consumer.channel_layer.group_discard.reset_mock()

        self.consumer.disconnect(close_code=1000)

        self.consumer.channel_layer.group_discard.assert_called_once_with(
            f"user_{self.user.uuid}", "test_channel"
        )

    def test_disconnect_without_group_name_skips_discard(self):
        self.consumer.group_name = None
        self.consumer._handlers = []

        self.consumer.disconnect(close_code=1000)

        self.consumer.channel_layer.group_discard.assert_not_called()

    def test_ws_event_forwards_to_client(self):
        self.consumer.ws_event(
            {"event": "playback.snapshot", "payload": {"devices": [{"id": "d1"}]}}
        )

        self.consumer.send_json.assert_called_once_with(
            {"event": "playback.snapshot", "payload": {"devices": [{"id": "d1"}]}}
        )

    def test_ws_event_with_missing_payload(self):
        self.consumer.ws_event({"event": "some.event"})

        self.consumer.send_json.assert_called_once_with(
            {"event": "some.event", "payload": None}
        )

    def test_ws_event_skips_when_exclude_matches_device(self):
        self.consumer.device_id = "test_device"

        self.consumer.ws_event(
            {
                "event": "playback.seek",
                "exclude_device_id": "test_device",
                "payload": {"position": 1.0},
            }
        )

        self.consumer.send_json.assert_not_called()

    def test_ws_event_forwards_when_exclude_differs(self):
        self.consumer.device_id = "test_device"

        self.consumer.ws_event(
            {
                "event": "playback.seek",
                "exclude_device_id": "other_device",
                "payload": {"position": 1.0},
            }
        )

        self.consumer.send_json.assert_called_once_with(
            {"event": "playback.seek", "payload": {"position": 1.0}}
        )

    def test_ws_event_forwards_when_exclude_missing_and_device_unset(self):
        self.consumer.device_id = None

        self.consumer.ws_event({"event": "playback.seek", "payload": {"position": 1.0}})

        self.consumer.send_json.assert_called_once_with(
            {"event": "playback.seek", "payload": {"position": 1.0}}
        )


class TestDeviceWSActionHandler(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = BaseUserFactory.create()

    def setUp(self):
        self.consumer = Mock()
        self.consumer.user = self.user
        self.consumer.user_uuid = str(self.user.uuid)
        self.consumer.group_name = f"user_{self.user.uuid}"
        self.consumer.channel_name = "test_channel"
        self.consumer.device_id = None
        self.stored_playback_state = StoredPlaybackState.objects.get(
            streamingprofile__user=self.user
        )
        self.consumer.channel_layer = MagicMock()
        self.consumer.channel_layer.group_send = AsyncMock()
        self.consumer.channel_layer.send = AsyncMock()

        # patch the broadcast helpers at the source so all instances use the mock
        self.broadcast_state_patcher = patch.object(
            PlaybackStateBroadcaster, "broadcast_snapshot"
        )
        self.send_state_patcher = patch.object(
            PlaybackStateBroadcaster, "send_snapshot_to_channel"
        )
        self.broadcast_devices_patcher = patch.object(
            DeviceStateBroadcaster, "broadcast_devices"
        )
        # patch the pause so the tests can check that it was called, without
        # depending on the play state stored on the `StoredPlaybackState` row
        self.pause_patcher = patch.object(
            StoredPlaybackState, "pause_at_estimated_position"
        )
        self.mock_broadcast_state = self.broadcast_state_patcher.start()
        self.mock_send_state = self.send_state_patcher.start()
        self.mock_broadcast_devices = self.broadcast_devices_patcher.start()
        self.mock_pause = self.pause_patcher.start()
        self.addCleanup(self.broadcast_state_patcher.stop)
        self.addCleanup(self.send_state_patcher.stop)
        self.addCleanup(self.broadcast_devices_patcher.stop)
        self.addCleanup(self.pause_patcher.stop)

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_register_calls_manager(self, mock_manager_cls):
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_register({"device_id": "device1", "name": "My Device"})

        mock_manager_cls.return_value.register_device.assert_called_once_with(
            device_id="device1",
            channel_name=self.consumer.channel_name,
            name="My Device",
        )
        self.assertEqual(handler.device_id, "device1")
        self.assertEqual(self.consumer.device_id, "device1")
        # the group broadcast catches up the joining channel on the device list
        # since it is already in the user group; the playback snapshot is delivered
        # directly because it is not broadcast on every register
        self.mock_broadcast_devices.assert_called_once_with()
        self.mock_send_state.assert_called_once_with(
            self.consumer.channel_layer,
            self.consumer.channel_name,
            self.stored_playback_state,
        )
        self.mock_broadcast_state.assert_not_called()

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_register_missing_device_id(self, mock_manager_cls):
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_register({"name": "My Device"})

        self.consumer.send_error.assert_called_once_with(
            "`device_id` and `name` are required for device.register"
        )
        mock_manager_cls.return_value.register_device.assert_not_called()
        self.mock_broadcast_state.assert_not_called()
        self.mock_send_state.assert_not_called()
        self.mock_broadcast_devices.assert_not_called()

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_register_forwards_valid_volume(self, mock_manager_cls):
        # FE owns the durable per-device volume in localStorage; without this
        # forwarding, register would re-hydrate Redis at DEFAULT_VOLUME and
        # subsequent device.list broadcasts would clobber the FE state
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_register(
            {"device_id": "device1", "name": "My Device", "volume": 42}
        )

        mock_manager_cls.return_value.register_device.assert_called_once_with(
            device_id="device1",
            channel_name=self.consumer.channel_name,
            name="My Device",
            volume=42,
        )

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_register_drops_invalid_volume(self, mock_manager_cls):
        # invalid volume must not block registration; manager applies its own default
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_register(
            {"device_id": "device1", "name": "My Device", "volume": 150}
        )
        handler.handle_register(
            {"device_id": "device1", "name": "My Device", "volume": "loud"}
        )
        handler.handle_register(
            {"device_id": "device1", "name": "My Device", "volume": -1}
        )

        for call in mock_manager_cls.return_value.register_device.call_args_list:
            self.assertNotIn("volume", call.kwargs)
        self.consumer.send_error.assert_not_called()

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_register_missing_name(self, mock_manager_cls):
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_register({"device_id": "device1"})

        self.consumer.send_error.assert_called_once_with(
            "`device_id` and `name` are required for device.register"
        )
        mock_manager_cls.return_value.register_device.assert_not_called()
        self.mock_broadcast_state.assert_not_called()
        self.mock_send_state.assert_not_called()
        self.mock_broadcast_devices.assert_not_called()

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_set_active_changed_pauses_playback(self, mock_manager_cls):
        mock_manager = mock_manager_cls.return_value
        mock_manager.set_active_device.return_value = True

        parent = Mock()
        parent.attach_mock(mock_manager, "device")
        parent.attach_mock(self.mock_pause, "pause")
        parent.attach_mock(self.mock_broadcast_state, "broadcast_state")
        parent.attach_mock(self.mock_broadcast_devices, "broadcast_devices")

        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_set_active({"device_id": "device1"})

        mock_manager.set_active_device.assert_called_once_with(device_id="device1")
        self.mock_pause.assert_called_once_with()
        self.mock_broadcast_state.assert_called_once_with(self.stored_playback_state)
        self.mock_broadcast_devices.assert_called_once_with()

        ordered = [
            c[0]
            for c in parent.mock_calls
            if c[0]
            in {
                "device.set_active_device",
                "pause",
                "broadcast_state",
                "broadcast_devices",
            }
        ]
        # the new active device must get the paused snapshot before device.list
        # tells it that it is active, otherwise it would start playing
        self.assertEqual(
            ordered,
            [
                "device.set_active_device",
                "pause",
                "broadcast_state",
                "broadcast_devices",
            ],
        )

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_set_active_no_change_does_not_pause_playback(self, mock_manager_cls):
        mock_manager = mock_manager_cls.return_value
        mock_manager.set_active_device.return_value = False

        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_set_active({"device_id": "device1"})

        mock_manager.set_active_device.assert_called_once_with(device_id="device1")
        self.mock_pause.assert_not_called()
        # nothing changed -> only device.list update (e.g. for clients that
        # care about the device touch); no snapshot
        self.mock_broadcast_state.assert_not_called()
        self.mock_broadcast_devices.assert_called_once_with()

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_set_active_missing_device_id(self, mock_manager_cls):
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_set_active({})

        self.consumer.send_error.assert_called_once_with(
            "`device_id` is required for device.set_active"
        )
        mock_manager_cls.return_value.set_active_device.assert_not_called()
        self.mock_broadcast_state.assert_not_called()
        self.mock_broadcast_devices.assert_not_called()

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_disconnect_clears_active_device_and_pauses_playback(
        self, mock_manager_cls
    ):
        mock_manager = mock_manager_cls.return_value
        mock_manager.clear_device.return_value = True

        parent = Mock()
        parent.attach_mock(mock_manager, "device")
        parent.attach_mock(self.mock_pause, "pause")
        parent.attach_mock(self.mock_broadcast_state, "broadcast_state")
        parent.attach_mock(self.mock_broadcast_devices, "broadcast_devices")

        handler = DeviceWSActionHandler(self.consumer)
        handler.device_id = "device1"
        handler.on_disconnect()

        mock_manager.clear_device.assert_called_once_with(
            device_id="device1", channel_name=self.consumer.channel_name
        )
        self.mock_pause.assert_called_once_with()
        self.mock_broadcast_state.assert_called_once_with(self.stored_playback_state)
        self.mock_broadcast_devices.assert_called_once_with()

        ordered = [
            c[0]
            for c in parent.mock_calls
            if c[0]
            in {
                "device.clear_device",
                "pause",
                "broadcast_state",
                "broadcast_devices",
            }
        ]
        self.assertEqual(
            ordered,
            [
                "device.clear_device",
                "pause",
                "broadcast_state",
                "broadcast_devices",
            ],
        )

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_disconnect_clears_non_active_device_does_not_pause_playback(
        self, mock_manager_cls
    ):
        mock_manager = mock_manager_cls.return_value
        mock_manager.clear_device.return_value = False

        handler = DeviceWSActionHandler(self.consumer)
        handler.device_id = "device1"
        handler.on_disconnect()

        mock_manager.clear_device.assert_called_once_with(
            device_id="device1", channel_name=self.consumer.channel_name
        )
        self.mock_pause.assert_not_called()
        # only the device list changed; no need to re-broadcast the playback state
        self.mock_broadcast_state.assert_not_called()
        self.mock_broadcast_devices.assert_called_once_with()

    @patch("streaming.ws.action_handlers.device.DeviceManager")
    def test_disconnect_without_device_id_is_noop(self, mock_manager_cls):
        handler = DeviceWSActionHandler(self.consumer)
        handler.on_disconnect()

        mock_manager_cls.return_value.clear_device.assert_not_called()
        self.mock_pause.assert_not_called()
        self.mock_broadcast_state.assert_not_called()
        self.mock_broadcast_devices.assert_not_called()


class TestPlaybackWSActionHandler(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = BaseUserFactory.create()

    def setUp(self):
        self.consumer = Mock()
        self.consumer.user = self.user
        self.consumer.user_uuid = str(self.user.uuid)
        self.consumer.group_name = f"user_{self.user.uuid}"
        self.consumer.channel_name = "sender_channel"
        self.consumer.device_id = "sender_device"
        self.stored_playback_state = StoredPlaybackState.objects.get(
            streamingprofile__user=self.user
        )
        self.stored_playback_state.current_collection_song = (
            CollectionSongFactory.create()
        )
        self.stored_playback_state.curr_play_item_unique_id = PLAY_ITEM_UNIQUE_ID
        self.stored_playback_state.save()
        self.consumer.channel_layer = MagicMock()
        self.consumer.channel_layer.send = AsyncMock()

        # patch the report so the handler tests do not depend on the rules
        # about which reports the row accepts
        self.apply_play_report_patcher = patch.object(
            StoredPlaybackState, "apply_play_report", return_value=True
        )
        self.device_manager_patcher = patch(
            "streaming.ws.action_handlers.playback.DeviceManager"
        )
        self.broadcast_state_patcher = patch.object(
            PlaybackStateBroadcaster, "broadcast_snapshot"
        )
        self.broadcast_devices_patcher = patch.object(
            DeviceStateBroadcaster, "broadcast_devices"
        )
        self.mock_apply_play_report = self.apply_play_report_patcher.start()
        self.mock_device_manager = self.device_manager_patcher.start().return_value
        self.mock_broadcast_state = self.broadcast_state_patcher.start()
        self.mock_broadcast_devices = self.broadcast_devices_patcher.start()
        self.addCleanup(self.apply_play_report_patcher.stop)
        self.addCleanup(self.device_manager_patcher.stop)
        self.addCleanup(self.broadcast_state_patcher.stop)
        self.addCleanup(self.broadcast_devices_patcher.stop)

        self.mock_device_manager.get_active_device_channel.return_value = (
            "active_channel"
        )
        self.mock_device_manager.get_active_device_id.return_value = "sender_device"

    def _assert_command_sent(self, channel_name: str, payload: dict) -> None:
        self.consumer.channel_layer.send.assert_called_once_with(
            channel_name,
            {"type": "ws_event", "event": ServerEvent.PLAYBACK_SET, "payload": payload},
        )

    def test_set_forwards_only_known_fields_to_active_device(self):
        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_set(
            {
                "is_playing": False,
                "song_pos_ms": 5000,
                "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID,
                "volume": 10,
            }
        )

        self._assert_command_sent(
            "active_channel",
            {
                "is_playing": False,
                "song_pos_ms": 5000,
                "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID,
            },
        )
        # the server stores nothing, the active device reports the result
        self.mock_apply_play_report.assert_not_called()
        self.mock_broadcast_state.assert_not_called()
        self.mock_device_manager.set_active_device.assert_not_called()

    def test_set_forwards_play_state_without_play_item(self):
        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_set(
            {"is_playing": True, "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID}
        )

        self._assert_command_sent("active_channel", {"is_playing": True})

    def test_set_with_no_valid_field_is_dropped(self):
        # no active device and a sender with a device id would normally
        # auto-activate, so this also proves that parsing runs first
        self.mock_device_manager.get_active_device_channel.return_value = None

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_set({})
        handler.handle_set({"is_playing": "yes"})
        handler.handle_set(
            {"song_pos_ms": -1, "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID}
        )
        handler.handle_set(
            {"song_pos_ms": "wat", "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID}
        )
        handler.handle_set({"song_pos_ms": 5000})
        handler.handle_set({"song_pos_ms": 5000, "curr_play_item_unique_id": 1})

        self.consumer.send_error.assert_not_called()
        self.consumer.channel_layer.send.assert_not_called()
        self.mock_device_manager.set_active_device.assert_not_called()

    def test_set_is_dropped_when_no_playback_is_stored(self):
        self.stored_playback_state.curr_play_item_unique_id = None
        self.stored_playback_state.save()

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_set({"is_playing": True})

        self.consumer.channel_layer.send.assert_not_called()

    def test_seek_with_stale_play_item_is_dropped(self):
        # the tab has not seen the latest track change yet
        self.mock_device_manager.get_active_device_channel.return_value = None

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_set(
            {
                "is_playing": True,
                "song_pos_ms": 5000,
                "curr_play_item_unique_id": OLD_PLAY_ITEM_UNIQUE_ID,
            }
        )

        self.consumer.channel_layer.send.assert_not_called()
        # auto-activate must run after the guard, so a dropped seek can't
        # claim the active device for the stale tab
        self.mock_device_manager.set_active_device.assert_not_called()

    def test_set_auto_activates_sender_when_no_device_is_active(self):
        self.mock_device_manager.get_active_device_channel.return_value = None

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_set(
            {"song_pos_ms": 5000, "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID}
        )

        self.mock_device_manager.set_active_device.assert_called_once_with(
            "sender_device"
        )
        self.mock_broadcast_devices.assert_called_once_with()
        self._assert_command_sent(
            "sender_channel",
            {"song_pos_ms": 5000, "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID},
        )

    def test_set_is_dropped_when_no_device_is_active_and_sender_has_no_device_id(
        self,
    ):
        self.mock_device_manager.get_active_device_channel.return_value = None
        self.consumer.device_id = None

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_set({"is_playing": True})

        self.mock_device_manager.set_active_device.assert_not_called()
        self.mock_broadcast_devices.assert_not_called()
        self.consumer.channel_layer.send.assert_not_called()

    def test_report_from_active_device_is_stored_and_broadcast(self):
        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_active_device_report(
            {
                "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID,
                "is_playing": False,
                "song_pos_ms": 42500,
            }
        )

        self.mock_apply_play_report.assert_called_once_with(
            PLAY_ITEM_UNIQUE_ID, False, 42500
        )
        self.mock_broadcast_state.assert_called_once_with(self.stored_playback_state)

    def test_report_from_device_that_is_not_active_is_dropped(self):
        self.mock_device_manager.get_active_device_id.return_value = "other_device"

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_active_device_report(
            {
                "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID,
                "is_playing": False,
                "song_pos_ms": 42500,
            }
        )

        self.mock_apply_play_report.assert_not_called()
        self.mock_broadcast_state.assert_not_called()

    def test_report_from_unregistered_sender_is_dropped_when_no_device_is_active(
        self,
    ):
        self.consumer.device_id = None
        self.mock_device_manager.get_active_device_id.return_value = None

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_active_device_report(
            {
                "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID,
                "is_playing": False,
                "song_pos_ms": 42500,
            }
        )

        self.mock_apply_play_report.assert_not_called()
        self.mock_broadcast_state.assert_not_called()

    def test_report_with_stale_play_item_is_dropped(self):
        self.mock_apply_play_report.return_value = False

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_active_device_report(
            {
                "curr_play_item_unique_id": OLD_PLAY_ITEM_UNIQUE_ID,
                "is_playing": False,
                "song_pos_ms": 42500,
            }
        )

        self.mock_broadcast_state.assert_not_called()

    def test_report_with_a_missing_or_invalid_field_is_dropped(self):
        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_active_device_report({"is_playing": False, "song_pos_ms": 1})
        handler.handle_active_device_report(
            {"curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID, "song_pos_ms": 1}
        )
        handler.handle_active_device_report(
            {"curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID, "is_playing": False}
        )
        handler.handle_active_device_report(
            {
                "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID,
                "is_playing": 0,
                "song_pos_ms": 1,
            }
        )
        handler.handle_active_device_report(
            {
                "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID,
                "is_playing": False,
                "song_pos_ms": -1,
            }
        )

        self.consumer.send_error.assert_not_called()
        self.mock_apply_play_report.assert_not_called()
        self.mock_broadcast_state.assert_not_called()

    def test_report_with_a_position_above_the_maximum_is_dropped(self):
        # no real position is past the end of the longest song that can be uploaded
        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_active_device_report(
            {
                "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID,
                "is_playing": False,
                "song_pos_ms": MAX_DURATION_SECONDS * 1000 + 1,
            }
        )

        self.mock_apply_play_report.assert_not_called()
        self.mock_broadcast_state.assert_not_called()


class TestTopicWSActionHandler(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = BaseUserFactory.create()

    def setUp(self):
        self.consumer = Mock()
        self.consumer.user = self.user
        self.consumer.channel_name = "test_channel"
        self.consumer.channel_layer = MagicMock()
        self.consumer.channel_layer.group_add = AsyncMock()
        self.consumer.channel_layer.group_discard = AsyncMock()
        self.consumer.subscribed_topics = set()
        self._original_validators = TOPIC_VALIDATORS.copy()

    def tearDown(self):
        TOPIC_VALIDATORS.clear()
        TOPIC_VALIDATORS.update(self._original_validators)

    def _register_validator(self, prefix, return_value=True):
        TOPIC_VALIDATORS[prefix] = Mock(return_value=return_value)

    def test_subscribe_happy_path(self):
        self._register_validator("chat")

        handler = TopicWSActionHandler(self.consumer)
        handler.handle_subscribe({"topic": "chat.abc-123"})

        TOPIC_VALIDATORS["chat"].assert_called_once_with(self.user, "abc-123")
        self.consumer.channel_layer.group_add.assert_called_once_with(
            "topic.chat.abc-123", "test_channel"
        )
        self.assertIn("topic.chat.abc-123", self.consumer.subscribed_topics)

    def test_subscribe_invalid_topic_format(self):
        handler = TopicWSActionHandler(self.consumer)
        handler.handle_subscribe({"topic": "invalid"})

        self.consumer.send_error.assert_called_once_with(
            "Invalid topic format, expected 'type.id'"
        )
        self.consumer.channel_layer.group_add.assert_not_called()

    def test_subscribe_empty_topic(self):
        handler = TopicWSActionHandler(self.consumer)
        handler.handle_subscribe({"topic": ""})

        self.consumer.send_error.assert_called_once_with(
            "Invalid topic format, expected 'type.id'"
        )

    def test_subscribe_missing_topic_key(self):
        handler = TopicWSActionHandler(self.consumer)
        handler.handle_subscribe({})

        self.consumer.send_error.assert_called_once_with(
            "Invalid topic format, expected 'type.id'"
        )

    def test_subscribe_unknown_prefix(self):
        handler = TopicWSActionHandler(self.consumer)
        handler.handle_subscribe({"topic": "unknown.abc-123"})

        self.consumer.send_error.assert_called_once_with("Unknown topic type: unknown")

    def test_subscribe_validator_denies(self):
        self._register_validator("chat", return_value=False)

        handler = TopicWSActionHandler(self.consumer)
        handler.handle_subscribe({"topic": "chat.abc-123"})

        self.consumer.send_error.assert_called_once_with(
            "Not authorized for chat.abc-123"
        )
        self.consumer.channel_layer.group_add.assert_not_called()
        self.assertEqual(self.consumer.subscribed_topics, set())

    def test_unsubscribe_subscribed_group(self):
        self._register_validator("chat")

        handler = TopicWSActionHandler(self.consumer)
        handler.handle_subscribe({"topic": "chat.abc-123"})
        self.consumer.channel_layer.group_add.reset_mock()

        handler.handle_unsubscribe({"topic": "chat.abc-123"})

        self.consumer.channel_layer.group_discard.assert_called_once_with(
            "topic.chat.abc-123", "test_channel"
        )
        self.assertNotIn("topic.chat.abc-123", self.consumer.subscribed_topics)

    def test_unsubscribe_non_subscribed_group_is_noop(self):
        self._register_validator("chat")

        handler = TopicWSActionHandler(self.consumer)
        handler.handle_unsubscribe({"topic": "chat.abc-123"})

        self.consumer.channel_layer.group_discard.assert_not_called()

    def test_unsubscribe_invalid_topic_is_noop(self):
        handler = TopicWSActionHandler(self.consumer)
        handler.handle_unsubscribe({"topic": "invalid"})

        self.consumer.channel_layer.group_discard.assert_not_called()

    def test_on_disconnect_discards_all_subscribed_groups(self):
        self._register_validator("chat")
        self._register_validator("collection_comments")

        handler = TopicWSActionHandler(self.consumer)
        handler.handle_subscribe({"topic": "chat.abc-123"})
        handler.handle_subscribe({"topic": "collection_comments.xyz-456"})
        self.consumer.channel_layer.group_discard.reset_mock()

        handler.on_disconnect()

        discard_calls = self.consumer.channel_layer.group_discard.call_args_list
        discarded_groups = {call[0][0] for call in discard_calls}
        self.assertEqual(
            discarded_groups,
            {"topic.chat.abc-123", "topic.collection_comments.xyz-456"},
        )
        self.assertEqual(self.consumer.subscribed_topics, set())


class TestTypingWSActionHandler(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = BaseUserFactory.create()

    def setUp(self):
        self.consumer = Mock()
        self.consumer.user = self.user
        self.consumer.channel_name = "test_channel"
        self.consumer.channel_layer = MagicMock()
        self.consumer.channel_layer.group_send = AsyncMock()
        self.consumer.subscribed_topics = {"topic.chat.abc-123"}

    def test_typing_broadcasts_when_subscribed(self):
        handler = TypingWSActionHandler(self.consumer)

        handler.handle_typing({"topic": "chat.abc-123"})

        self.consumer.channel_layer.group_send.assert_called_once_with(
            "topic.chat.abc-123",
            {
                "type": "ws_event",
                "event": "chat.typing",
                "payload": {
                    "user_uuid": str(self.user.uuid),
                    "display_name": self.user.display_name,
                },
            },
        )

    def test_typing_dropped_when_not_subscribed(self):
        self.consumer.subscribed_topics = set()
        handler = TypingWSActionHandler(self.consumer)

        handler.handle_typing({"topic": "chat.abc-123"})

        self.consumer.channel_layer.group_send.assert_not_called()

    def test_typing_dropped_for_prefix_without_registered_event(self):
        self.consumer.subscribed_topics = {"topic.unknown.xyz-456"}
        handler = TypingWSActionHandler(self.consumer)

        handler.handle_typing({"topic": "unknown.xyz-456"})

        self.consumer.channel_layer.group_send.assert_not_called()

    def test_typing_dropped_for_invalid_topic(self):
        handler = TypingWSActionHandler(self.consumer)

        handler.handle_typing({"topic": "invalid"})
        handler.handle_typing({})

        self.consumer.channel_layer.group_send.assert_not_called()

    @patch("social.ws.time.monotonic")
    def test_typing_throttled_within_min_interval(self, mock_monotonic):
        mock_monotonic.return_value = 100.0
        handler = TypingWSActionHandler(self.consumer)

        handler.handle_typing({"topic": "chat.abc-123"})
        mock_monotonic.return_value = 100.0 + TypingWSActionHandler.MIN_INTERVAL - 0.5
        handler.handle_typing({"topic": "chat.abc-123"})

        self.consumer.channel_layer.group_send.assert_called_once()

    @patch("social.ws.time.monotonic")
    def test_typing_accepted_after_min_interval(self, mock_monotonic):
        mock_monotonic.return_value = 100.0
        handler = TypingWSActionHandler(self.consumer)

        handler.handle_typing({"topic": "chat.abc-123"})
        mock_monotonic.return_value = 100.0 + TypingWSActionHandler.MIN_INTERVAL + 0.1
        handler.handle_typing({"topic": "chat.abc-123"})

        self.assertEqual(self.consumer.channel_layer.group_send.call_count, 2)
