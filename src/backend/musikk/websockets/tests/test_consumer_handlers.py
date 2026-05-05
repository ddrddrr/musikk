from unittest.mock import AsyncMock, MagicMock, Mock, patch

from django.test import TestCase
from social.ws import TypingWSActionHandler
from streaming.events import ServerEvent
from streaming.state_broadcasters.device import DeviceStateBroadcaster
from streaming.state_broadcasters.player import PlayerStateBroadcaster
from streaming.ws import DeviceWSActionHandler, PlaybackWSActionHandler
from users.tests.factories import BaseUserFactory

from websockets.action_handler import WSActionHandler
from websockets.base_consumer import BaseConsumer
from websockets.topics import TOPIC_VALIDATORS, TopicWSActionHandler


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

    @patch("streaming.ws.DeviceManager")
    @patch("streaming.ws.PlaybackManager")
    def test_connect_authenticated_user(self, _mock_playback, mock_device):
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
                "device.heartbeat",
                "playback.activate",
                "playback.stop",
                "playback.seek",
                "playback.tick",
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

    @patch("streaming.ws.DeviceManager")
    @patch("streaming.ws.PlaybackManager")
    def test_connect_group_add_failure_returns_early(
        self, _mock_playback, _mock_device
    ):
        self.consumer.channel_layer.group_add = AsyncMock(
            side_effect=Exception("redis down")
        )

        self.consumer.connect()

        self.consumer.accept.assert_not_called()
        self.assertEqual(self.consumer._action_map, {})

    @patch("streaming.ws.DeviceManager")
    @patch("streaming.ws.PlaybackManager")
    def test_connect_raises_on_action_collision(self, _mock_playback, _mock_device):
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

    @patch("streaming.ws.DeviceManager")
    @patch("streaming.ws.PlaybackManager")
    def test_disconnect_discards_group_and_calls_handlers(
        self, _mock_playback, _mock_device
    ):
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
        self.consumer.channel_layer = MagicMock()
        self.consumer.channel_layer.group_send = AsyncMock()
        self.consumer.channel_layer.send = AsyncMock()

        # patch the broadcast helpers at the source so all instances use the mock,
        # including the PlayerStateBroadcaster the PlaybackStateBroadcaster instantiates internally
        self.broadcast_state_patcher = patch.object(
            PlayerStateBroadcaster, "broadcast_state"
        )
        self.send_state_patcher = patch.object(
            PlayerStateBroadcaster, "send_state_to_channel"
        )
        self.broadcast_devices_patcher = patch.object(
            DeviceStateBroadcaster, "broadcast_devices"
        )
        self.send_devices_patcher = patch.object(
            DeviceStateBroadcaster, "send_devices_to_channel"
        )
        self.mock_broadcast_state = self.broadcast_state_patcher.start()
        self.mock_send_state = self.send_state_patcher.start()
        self.mock_broadcast_devices = self.broadcast_devices_patcher.start()
        self.mock_send_devices = self.send_devices_patcher.start()
        self.addCleanup(self.broadcast_state_patcher.stop)
        self.addCleanup(self.send_state_patcher.stop)
        self.addCleanup(self.broadcast_devices_patcher.stop)
        self.addCleanup(self.send_devices_patcher.stop)

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_register_calls_manager(self, mock_manager_cls, _mock_playback_cls):
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_register({"device_id": "device1", "name": "My Device"})

        mock_manager_cls.return_value.register_device.assert_called_once_with(
            device_id="device1", name="My Device"
        )
        self.assertEqual(handler.device_id, "device1")
        self.assertEqual(self.consumer.device_id, "device1")
        # group broadcast for already-connected clients about the new device,
        # and direct delivery of full snapshot + device list to the joining channel
        self.mock_broadcast_devices.assert_called_once_with()
        self.mock_send_state.assert_called_once_with(
            self.consumer.channel_layer, self.consumer.channel_name
        )
        self.mock_send_devices.assert_called_once_with(
            self.consumer.channel_layer, self.consumer.channel_name
        )
        self.mock_broadcast_state.assert_not_called()

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_register_missing_device_id(self, mock_manager_cls, _mock_playback_cls):
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_register({"name": "My Device"})

        self.consumer.send_error.assert_called_once_with(
            "`device_id` and `name` are required for device.register"
        )
        mock_manager_cls.return_value.register_device.assert_not_called()
        self.mock_broadcast_state.assert_not_called()
        self.mock_send_state.assert_not_called()
        self.mock_broadcast_devices.assert_not_called()
        self.mock_send_devices.assert_not_called()

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_register_forwards_valid_volume(self, mock_manager_cls, _mock_playback_cls):
        # FE owns the durable per-device volume in localStorage; without this
        # forwarding, register would re-hydrate Redis at DEFAULT_VOLUME and
        # subsequent device.list broadcasts would clobber the FE state
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_register(
            {"device_id": "device1", "name": "My Device", "volume": 42}
        )

        mock_manager_cls.return_value.register_device.assert_called_once_with(
            device_id="device1", name="My Device", volume=42
        )

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_register_drops_invalid_volume(self, mock_manager_cls, _mock_playback_cls):
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

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_register_missing_name(self, mock_manager_cls, _mock_playback_cls):
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_register({"device_id": "device1"})

        self.consumer.send_error.assert_called_once_with(
            "`device_id` and `name` are required for device.register"
        )
        mock_manager_cls.return_value.register_device.assert_not_called()
        self.mock_broadcast_state.assert_not_called()
        self.mock_send_state.assert_not_called()
        self.mock_broadcast_devices.assert_not_called()
        self.mock_send_devices.assert_not_called()

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_heartbeat_calls_manager(self, mock_manager_cls, _mock_playback_cls):
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_heartbeat({"device_id": "device1"})

        mock_manager_cls.return_value.touch_device.assert_called_once_with(
            device_id="device1"
        )
        self.mock_broadcast_devices.assert_called_once_with()
        self.mock_broadcast_state.assert_not_called()

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_heartbeat_missing_device_id(self, mock_manager_cls, _mock_playback_cls):
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_heartbeat({})

        self.consumer.send_error.assert_called_once_with(
            "`device_id` is required for device.heartbeat"
        )
        mock_manager_cls.return_value.touch_device.assert_not_called()
        self.mock_broadcast_devices.assert_not_called()
        self.mock_broadcast_state.assert_not_called()

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_set_active_changed_stops_playback(
        self, mock_manager_cls, mock_playback_cls
    ):
        # changing active device must stop playback first so the snapshot
        # carries is_playback_active=false (otherwise the new active device
        # would auto-resume via syncLocalPlaybackStateWithRemote)
        mock_manager = mock_manager_cls.return_value
        mock_manager.set_active_device.return_value = True
        mock_playback = mock_playback_cls.return_value

        parent = Mock()
        parent.attach_mock(mock_manager, "device")
        parent.attach_mock(mock_playback, "playback")
        parent.attach_mock(self.mock_broadcast_state, "broadcast_state")
        parent.attach_mock(self.mock_broadcast_devices, "broadcast_devices")

        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_set_active({"device_id": "device1"})

        mock_manager.set_active_device.assert_called_once_with(device_id="device1")
        mock_playback.stop.assert_called_once()
        self.mock_broadcast_state.assert_called_once_with(include_position=False)
        self.mock_broadcast_devices.assert_called_once_with()

        ordered = [
            c[0]
            for c in parent.mock_calls
            if c[0]
            in {
                "device.set_active_device",
                "playback.stop",
                "broadcast_state",
                "broadcast_devices",
            }
        ]
        # snapshot must precede device.list so the new-active device sees
        # is_playback_active=false before it sees isThisDeviceActive=true
        self.assertEqual(
            ordered,
            [
                "device.set_active_device",
                "playback.stop",
                "broadcast_state",
                "broadcast_devices",
            ],
        )

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_set_active_no_change_does_not_stop_playback(
        self, mock_manager_cls, mock_playback_cls
    ):
        mock_manager = mock_manager_cls.return_value
        mock_manager.set_active_device.return_value = False

        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_set_active({"device_id": "device1"})

        mock_manager.set_active_device.assert_called_once_with(device_id="device1")
        mock_playback_cls.return_value.stop.assert_not_called()
        # nothing changed -> only device.list update (e.g. for clients that
        # care about the device touch); no snapshot
        self.mock_broadcast_state.assert_not_called()
        self.mock_broadcast_devices.assert_called_once_with()

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_set_active_missing_device_id(self, mock_manager_cls, _mock_playback_cls):
        handler = DeviceWSActionHandler(self.consumer)
        handler.handle_set_active({})

        self.consumer.send_error.assert_called_once_with(
            "`device_id` is required for device.set_active"
        )
        mock_manager_cls.return_value.set_active_device.assert_not_called()
        self.mock_broadcast_state.assert_not_called()
        self.mock_broadcast_devices.assert_not_called()

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_disconnect_clears_active_device_and_stops_playback(
        self, mock_manager_cls, mock_playback_cls
    ):
        mock_manager = mock_manager_cls.return_value
        mock_manager.clear_device.return_value = True
        mock_playback = mock_playback_cls.return_value

        parent = Mock()
        parent.attach_mock(mock_manager, "device")
        parent.attach_mock(mock_playback, "playback")
        parent.attach_mock(self.mock_broadcast_state, "broadcast_state")
        parent.attach_mock(self.mock_broadcast_devices, "broadcast_devices")

        handler = DeviceWSActionHandler(self.consumer)
        handler.device_id = "device1"
        handler.on_disconnect()

        mock_manager.clear_device.assert_called_once_with("device1")
        mock_playback.stop.assert_called_once()
        self.mock_broadcast_state.assert_called_once_with(include_position=False)
        self.mock_broadcast_devices.assert_called_once_with()

        ordered = [
            c[0]
            for c in parent.mock_calls
            if c[0]
            in {
                "device.clear_device",
                "playback.stop",
                "broadcast_state",
                "broadcast_devices",
            }
        ]
        self.assertEqual(
            ordered,
            [
                "device.clear_device",
                "playback.stop",
                "broadcast_state",
                "broadcast_devices",
            ],
        )

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_disconnect_clears_non_active_device_does_not_stop_playback(
        self, mock_manager_cls, mock_playback_cls
    ):
        mock_manager = mock_manager_cls.return_value
        mock_manager.clear_device.return_value = False

        handler = DeviceWSActionHandler(self.consumer)
        handler.device_id = "device1"
        handler.on_disconnect()

        mock_manager.clear_device.assert_called_once_with("device1")
        mock_playback_cls.return_value.stop.assert_not_called()
        # only the device list changed; no need to re-broadcast player state
        self.mock_broadcast_state.assert_not_called()
        self.mock_broadcast_devices.assert_called_once_with()

    @patch("streaming.ws.PlaybackManager")
    @patch("streaming.ws.DeviceManager")
    def test_disconnect_without_device_id_is_noop(
        self, mock_manager_cls, mock_playback_cls
    ):
        handler = DeviceWSActionHandler(self.consumer)
        handler.on_disconnect()

        mock_manager_cls.return_value.clear_device.assert_not_called()
        mock_playback_cls.return_value.stop.assert_not_called()
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
        self.consumer.channel_name = "test_channel"
        self.consumer.device_id = None
        self.consumer.channel_layer = MagicMock()
        self.consumer.channel_layer.group_send = AsyncMock()

        # patch the snapshot broadcast at the source so both ws.py's direct
        # PlayerStateBroadcaster usage AND the one inside PlaybackStateBroadcaster get caught
        self.broadcast_patcher = patch.object(PlayerStateBroadcaster, "broadcast_state")
        self.broadcast_devices_patcher = patch.object(
            DeviceStateBroadcaster, "broadcast_devices"
        )
        self.mock_broadcast_state = self.broadcast_patcher.start()
        self.mock_broadcast_devices = self.broadcast_devices_patcher.start()
        self.addCleanup(self.broadcast_patcher.stop)
        self.addCleanup(self.broadcast_devices_patcher.stop)

        # seek/tick now broadcast via PlaybackStateBroadcaster, which goes
        # through send_ws_event -> get_channel_layer; patch that so we can
        # assert on the actual group_send the broadcaster makes.
        self.event_channel_layer_patcher = patch(
            "websockets.event_helpers.get_channel_layer"
        )
        self.mock_event_channel_layer = MagicMock()
        self.mock_event_channel_layer.group_send = AsyncMock()
        self.event_channel_layer_patcher.start().return_value = (
            self.mock_event_channel_layer
        )
        self.addCleanup(self.event_channel_layer_patcher.stop)

    @patch("streaming.state_broadcasters.playback.PlaybackManager")
    @patch("streaming.ws.PlaybackManager")
    def test_activate_calls_manager_and_broadcasts(
        self, mock_ws_manager_cls, mock_coord_manager_cls
    ):
        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_activate({})

        # PlaybackStateBroadcaster.activate -> manager.activate + player snapshot
        mock_coord_manager_cls.return_value.activate.assert_called_once()
        self.mock_broadcast_state.assert_called_once_with()

    @patch("streaming.state_broadcasters.playback.PlaybackManager")
    @patch("streaming.ws.PlaybackManager")
    def test_stop_calls_manager_and_broadcasts(
        self, mock_ws_manager_cls, mock_coord_manager_cls
    ):
        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_stop({})

        mock_coord_manager_cls.return_value.stop.assert_called_once()
        self.mock_broadcast_state.assert_called_once_with()

    @patch("streaming.ws.PlaybackManager")
    def test_seek_persists_and_broadcasts(self, mock_manager_cls):
        mock_manager = mock_manager_cls.return_value
        self.consumer.device_id = "test_device"

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_seek({"position": 42.5, "collection_song_uuid": "cs-1"})

        mock_manager.set_position.assert_called_once_with(42.5, "cs-1")
        self.mock_event_channel_layer.group_send.assert_called_once_with(
            f"user_{self.user.uuid}",
            {
                "type": "ws_event",
                "event": ServerEvent.PLAYBACK_SEEK,
                "exclude_device_id": "test_device",
                "payload": {
                    "position": 42.5,
                    "collection_song_uuid": "cs-1",
                },
            },
        )

    @patch("streaming.ws.PlaybackManager")
    def test_seek_passes_through_null_collection_song_uuid(self, mock_manager_cls):
        mock_manager = mock_manager_cls.return_value

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_seek({"position": 0, "collection_song_uuid": None})

        mock_manager.set_position.assert_called_once_with(0.0, None)
        call_args = self.mock_event_channel_layer.group_send.call_args
        self.assertIsNone(call_args[0][1]["payload"]["collection_song_uuid"])

    @patch("streaming.ws.DeviceManager")
    @patch("streaming.ws.PlaybackManager")
    def test_seek_invalid_position_silently_dropped(
        self, mock_manager_cls, mock_device_cls
    ):
        # device_id + no active device would normally trigger auto-activate;
        # asserting it's NOT called proves parse runs before that side effect
        self.consumer.device_id = "device1"
        mock_device_cls.return_value.get_active_device_id.return_value = None

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_seek({"position": -1})
        handler.handle_seek({"position": "wat"})
        handler.handle_seek({})

        self.consumer.send_error.assert_not_called()
        mock_manager_cls.return_value.set_position.assert_not_called()
        self.mock_event_channel_layer.group_send.assert_not_called()
        mock_device_cls.return_value.set_active_device.assert_not_called()

    @patch("streaming.ws.time.monotonic")
    @patch("streaming.ws.PlaybackManager")
    def test_tick_persists_and_broadcasts(self, mock_manager_cls, mock_monotonic):
        mock_monotonic.return_value = 100.0
        mock_manager = mock_manager_cls.return_value
        self.consumer.device_id = "test_device"

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_tick({"position": 12.0, "collection_song_uuid": "cs-1"})

        mock_manager.set_position.assert_called_once_with(12.0, "cs-1")
        self.mock_event_channel_layer.group_send.assert_called_once_with(
            f"user_{self.user.uuid}",
            {
                "type": "ws_event",
                "event": ServerEvent.PLAYBACK_TICK,
                "exclude_device_id": "test_device",
                "payload": {
                    "position": 12.0,
                    "collection_song_uuid": "cs-1",
                },
            },
        )

    @patch("streaming.ws.time.monotonic")
    @patch("streaming.ws.PlaybackManager")
    def test_tick_throttled_within_min_interval(self, mock_manager_cls, mock_monotonic):
        mock_monotonic.return_value = 100.0

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_tick({"position": 12.0, "collection_song_uuid": "cs-1"})
        mock_monotonic.return_value = (
            100.0 + PlaybackWSActionHandler.MIN_TICK_INTERVAL - 0.5
        )
        handler.handle_tick({"position": 13.0, "collection_song_uuid": "cs-1"})

        mock_manager_cls.return_value.set_position.assert_called_once()
        self.mock_event_channel_layer.group_send.assert_called_once()

    @patch("streaming.ws.time.monotonic")
    @patch("streaming.ws.PlaybackManager")
    def test_tick_accepted_after_min_interval(self, mock_manager_cls, mock_monotonic):
        mock_monotonic.return_value = 100.0

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_tick({"position": 12.0, "collection_song_uuid": "cs-1"})
        mock_monotonic.return_value = (
            100.0 + PlaybackWSActionHandler.MIN_TICK_INTERVAL + 0.1
        )
        handler.handle_tick({"position": 13.0, "collection_song_uuid": "cs-1"})

        self.assertEqual(mock_manager_cls.return_value.set_position.call_count, 2)
        self.assertEqual(self.mock_event_channel_layer.group_send.call_count, 2)

    @patch("streaming.ws.time.monotonic")
    @patch("streaming.ws.PlaybackManager")
    def test_tick_invalid_position_silently_dropped(
        self, mock_manager_cls, mock_monotonic
    ):
        mock_monotonic.return_value = 100.0

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_tick({"position": -1})
        handler.handle_tick({"position": "wat"})
        handler.handle_tick({})

        self.consumer.send_error.assert_not_called()
        mock_manager_cls.return_value.set_position.assert_not_called()
        self.mock_event_channel_layer.group_send.assert_not_called()
        # invalid ticks don't consume the throttle slot, so the next
        # legitimate tick after a malformed one still gets through
        self.assertEqual(handler._last_tick, 0.0)

    @patch("streaming.ws.DeviceManager")
    @patch("streaming.ws.PlaybackManager")
    def test_seek_auto_activates_when_no_active_device(
        self, _mock_playback_cls, mock_device_cls
    ):
        self.consumer.device_id = "device1"
        mock_device = mock_device_cls.return_value
        mock_device.get_active_device_id.return_value = None
        mock_device.set_active_device.return_value = True

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_seek({"position": 5.0, "collection_song_uuid": "cs-1"})

        mock_device.set_active_device.assert_called_once_with("device1")
        # auto-activate broadcasts the device list so other clients see the
        # active-device flip; position update arrives via the following
        # PLAYBACK_SEEK group_send. snapshot is unaffected (no playback change).
        self.mock_broadcast_devices.assert_called_once_with()
        self.mock_broadcast_state.assert_not_called()
        self.mock_event_channel_layer.group_send.assert_called_once()
        call_args = self.mock_event_channel_layer.group_send.call_args
        self.assertEqual(call_args[0][1]["event"], ServerEvent.PLAYBACK_SEEK)

    @patch("streaming.ws.DeviceManager")
    @patch("streaming.ws.PlaybackManager")
    def test_seek_does_not_auto_activate_when_active_exists(
        self, _mock_playback_cls, mock_device_cls
    ):
        self.consumer.device_id = "device1"
        mock_device = mock_device_cls.return_value
        mock_device.get_active_device_id.return_value = "device2"

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_seek({"position": 5.0, "collection_song_uuid": "cs-1"})

        mock_device.set_active_device.assert_not_called()
        self.mock_event_channel_layer.group_send.assert_called_once()
        call_args = self.mock_event_channel_layer.group_send.call_args
        self.assertEqual(call_args[0][1]["event"], ServerEvent.PLAYBACK_SEEK)

    @patch("streaming.ws.DeviceManager")
    @patch("streaming.ws.PlaybackManager")
    def test_seek_does_not_auto_activate_when_consumer_has_no_device_id(
        self, _mock_playback_cls, mock_device_cls
    ):
        self.consumer.device_id = None

        handler = PlaybackWSActionHandler(self.consumer)
        handler.handle_seek({"position": 5.0, "collection_song_uuid": "cs-1"})

        mock_device_cls.assert_not_called()
        self.mock_event_channel_layer.group_send.assert_called_once()
        call_args = self.mock_event_channel_layer.group_send.call_args
        self.assertEqual(call_args[0][1]["event"], ServerEvent.PLAYBACK_SEEK)


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
