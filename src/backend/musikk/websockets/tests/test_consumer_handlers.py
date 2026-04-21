from unittest.mock import AsyncMock, MagicMock, Mock, patch

from django.test import TestCase
from streaming.ws import DeviceHandler, PlaybackHandler, ServerEvent
from users.tests.factories import BaseUserFactory

from websockets.action_handler import WSActionHandler
from websockets.base_consumer import BaseConsumer
from websockets.topics import TOPIC_VALIDATORS, TopicHandler


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
                "device.heartbeat",
                "playback.activate",
                "playback.stop",
                "subscribe",
                "unsubscribe",
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

        self.consumer.action_handler_classes = [DeviceHandler, DuplicateHandler]

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
            {"event": "device.list", "payload": {"devices": [{"id": "d1"}]}}
        )

        self.consumer.send_json.assert_called_once_with(
            {"event": "device.list", "payload": {"devices": [{"id": "d1"}]}}
        )

    def test_ws_event_with_missing_payload(self):
        self.consumer.ws_event({"event": "some.event"})

        self.consumer.send_json.assert_called_once_with(
            {"event": "some.event", "payload": None}
        )


class TestDeviceHandler(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = BaseUserFactory.create()

    def setUp(self):
        self.consumer = Mock()
        self.consumer.user = self.user
        self.consumer.user_uuid = str(self.user.uuid)
        self.consumer.group_name = f"user_{self.user.uuid}"
        self.consumer.channel_layer = MagicMock()
        self.consumer.channel_layer.group_send = AsyncMock()

    @patch("streaming.ws.DeviceManager")
    def test_register_calls_manager_and_broadcasts(self, mock_manager_cls):
        mock_manager = mock_manager_cls.return_value
        devices = [{"id": "device1", "name": "My Device", "is_active": False}]
        mock_manager.get_devices.return_value = devices

        handler = DeviceHandler(self.consumer)
        handler.handle_register({"device_id": "device1", "name": "My Device"})

        mock_manager.register_device.assert_called_once_with(
            device_id="device1", name="My Device"
        )
        self.assertEqual(handler.device_id, "device1")

        self.consumer.channel_layer.group_send.assert_called_once_with(
            f"user_{self.user.uuid}",
            {
                "type": "ws_event",
                "event": ServerEvent.DEVICE_LIST,
                "payload": {"devices": devices},
            },
        )

    @patch("streaming.ws.DeviceManager")
    def test_register_missing_device_id(self, mock_manager_cls):
        handler = DeviceHandler(self.consumer)
        handler.handle_register({"name": "My Device"})

        self.consumer.send_error.assert_called_once_with(
            "'device_id' and 'name' are required for device.register"
        )
        mock_manager_cls.return_value.register_device.assert_not_called()

    @patch("streaming.ws.DeviceManager")
    def test_register_missing_name(self, mock_manager_cls):
        handler = DeviceHandler(self.consumer)
        handler.handle_register({"device_id": "device1"})

        self.consumer.send_error.assert_called_once_with(
            "'device_id' and 'name' are required for device.register"
        )
        mock_manager_cls.return_value.register_device.assert_not_called()

    @patch("streaming.ws.DeviceManager")
    def test_heartbeat_calls_manager_and_broadcasts(self, mock_manager_cls):
        mock_manager = mock_manager_cls.return_value
        devices = [{"id": "device1", "name": "Device 1", "is_active": True}]
        mock_manager.get_devices.return_value = devices

        handler = DeviceHandler(self.consumer)
        handler.handle_heartbeat({"device_id": "device1"})

        mock_manager.touch_device.assert_called_once_with(device_id="device1")
        self.consumer.channel_layer.group_send.assert_called_once()

    @patch("streaming.ws.DeviceManager")
    def test_heartbeat_missing_device_id(self, mock_manager_cls):
        handler = DeviceHandler(self.consumer)
        handler.handle_heartbeat({})

        self.consumer.send_error.assert_called_once_with(
            "'device_id' is required for device.heartbeat"
        )
        mock_manager_cls.return_value.touch_device.assert_not_called()

    @patch("streaming.ws.DeviceManager")
    def test_set_active_calls_manager_and_broadcasts(self, mock_manager_cls):
        mock_manager = mock_manager_cls.return_value
        mock_manager.get_devices.return_value = [
            {"id": "device1", "name": "Device 1", "is_active": True},
            {"id": "device2", "name": "Device 2", "is_active": False},
        ]

        handler = DeviceHandler(self.consumer)
        handler.handle_set_active({"device_id": "device1"})

        mock_manager.set_active_device.assert_called_once_with(device_id="device1")

        self.consumer.channel_layer.group_send.assert_called_once()
        call_args = self.consumer.channel_layer.group_send.call_args
        self.assertEqual(call_args[0][0], f"user_{self.user.uuid}")
        self.assertEqual(call_args[0][1]["event"], ServerEvent.DEVICE_LIST)

    @patch("streaming.ws.DeviceManager")
    def test_set_active_missing_device_id(self, mock_manager_cls):
        handler = DeviceHandler(self.consumer)
        handler.handle_set_active({})

        self.consumer.send_error.assert_called_once_with(
            "'device_id' is required for device.set_active"
        )
        mock_manager_cls.return_value.set_active_device.assert_not_called()

    @patch("streaming.ws.DeviceManager")
    def test_disconnect_clears_device_and_broadcasts(self, mock_manager_cls):
        mock_manager = mock_manager_cls.return_value
        mock_manager.get_devices.return_value = [
            {"id": "device2", "name": "Device 2", "is_active": False}
        ]

        handler = DeviceHandler(self.consumer)
        handler.device_id = "device1"
        handler.on_disconnect()

        mock_manager.clear_device.assert_called_once_with("device1")
        self.consumer.channel_layer.group_send.assert_called_once()
        call_args = self.consumer.channel_layer.group_send.call_args
        self.assertEqual(call_args[0][0], f"user_{self.user.uuid}")
        self.assertEqual(call_args[0][1]["event"], ServerEvent.DEVICE_LIST)

    @patch("streaming.ws.DeviceManager")
    def test_disconnect_without_device_id_is_noop(self, mock_manager_cls):
        handler = DeviceHandler(self.consumer)
        handler.on_disconnect()

        mock_manager_cls.return_value.clear_device.assert_not_called()
        self.consumer.channel_layer.group_send.assert_not_called()


class TestPlaybackHandler(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = BaseUserFactory.create()

    def setUp(self):
        self.consumer = Mock()
        self.consumer.user = self.user
        self.consumer.user_uuid = str(self.user.uuid)
        self.consumer.group_name = f"user_{self.user.uuid}"
        self.consumer.channel_layer = MagicMock()
        self.consumer.channel_layer.group_send = AsyncMock()

    @patch("streaming.ws.PlaybackManager")
    def test_activate_calls_manager_and_broadcasts(self, mock_manager_cls):
        mock_manager = mock_manager_cls.return_value
        mock_manager.is_playback_active.return_value = True

        handler = PlaybackHandler(self.consumer)
        handler.handle_activate({})

        mock_manager.activate.assert_called_once()
        self.consumer.channel_layer.group_send.assert_called_once_with(
            f"user_{self.user.uuid}",
            {
                "type": "ws_event",
                "event": ServerEvent.PLAYBACK_CHANGE,
                "payload": {"playback": True},
            },
        )

    @patch("streaming.ws.PlaybackManager")
    def test_stop_calls_manager_and_broadcasts(self, mock_manager_cls):
        mock_manager = mock_manager_cls.return_value
        mock_manager.is_playback_active.return_value = False

        handler = PlaybackHandler(self.consumer)
        handler.handle_stop({})

        mock_manager.stop.assert_called_once()
        self.consumer.channel_layer.group_send.assert_called_once_with(
            f"user_{self.user.uuid}",
            {
                "type": "ws_event",
                "event": ServerEvent.PLAYBACK_CHANGE,
                "payload": {"playback": False},
            },
        )


class TestTopicHandler(TestCase):
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
        self._original_validators = TOPIC_VALIDATORS.copy()

    def tearDown(self):
        TOPIC_VALIDATORS.clear()
        TOPIC_VALIDATORS.update(self._original_validators)

    def _register_validator(self, prefix, return_value=True):
        TOPIC_VALIDATORS[prefix] = Mock(return_value=return_value)

    def test_subscribe_happy_path(self):
        self._register_validator("chat")

        handler = TopicHandler(self.consumer)
        handler.handle_subscribe({"topic": "chat.abc-123"})

        TOPIC_VALIDATORS["chat"].assert_called_once_with(self.user, "abc-123")
        self.consumer.channel_layer.group_add.assert_called_once_with(
            "topic.chat.abc-123", "test_channel"
        )
        self.assertIn("topic.chat.abc-123", handler._subscribed)

    def test_subscribe_invalid_topic_format(self):
        handler = TopicHandler(self.consumer)
        handler.handle_subscribe({"topic": "invalid"})

        self.consumer.send_error.assert_called_once_with(
            "Invalid topic format, expected 'type.id'"
        )
        self.consumer.channel_layer.group_add.assert_not_called()

    def test_subscribe_empty_topic(self):
        handler = TopicHandler(self.consumer)
        handler.handle_subscribe({"topic": ""})

        self.consumer.send_error.assert_called_once_with(
            "Invalid topic format, expected 'type.id'"
        )

    def test_subscribe_missing_topic_key(self):
        handler = TopicHandler(self.consumer)
        handler.handle_subscribe({})

        self.consumer.send_error.assert_called_once_with(
            "Invalid topic format, expected 'type.id'"
        )

    def test_subscribe_unknown_prefix(self):
        handler = TopicHandler(self.consumer)
        handler.handle_subscribe({"topic": "unknown.abc-123"})

        self.consumer.send_error.assert_called_once_with("Unknown topic type: unknown")

    def test_subscribe_validator_denies(self):
        self._register_validator("chat", return_value=False)

        handler = TopicHandler(self.consumer)
        handler.handle_subscribe({"topic": "chat.abc-123"})

        self.consumer.send_error.assert_called_once_with(
            "Not authorized for chat.abc-123"
        )
        self.consumer.channel_layer.group_add.assert_not_called()
        self.assertEqual(handler._subscribed, set())

    def test_unsubscribe_subscribed_group(self):
        self._register_validator("chat")

        handler = TopicHandler(self.consumer)
        handler.handle_subscribe({"topic": "chat.abc-123"})
        self.consumer.channel_layer.group_add.reset_mock()

        handler.handle_unsubscribe({"topic": "chat.abc-123"})

        self.consumer.channel_layer.group_discard.assert_called_once_with(
            "topic.chat.abc-123", "test_channel"
        )
        self.assertNotIn("topic.chat.abc-123", handler._subscribed)

    def test_unsubscribe_non_subscribed_group_is_noop(self):
        self._register_validator("chat")

        handler = TopicHandler(self.consumer)
        handler.handle_unsubscribe({"topic": "chat.abc-123"})

        self.consumer.channel_layer.group_discard.assert_not_called()

    def test_unsubscribe_invalid_topic_is_noop(self):
        handler = TopicHandler(self.consumer)
        handler.handle_unsubscribe({"topic": "invalid"})

        self.consumer.channel_layer.group_discard.assert_not_called()

    def test_on_disconnect_discards_all_subscribed_groups(self):
        self._register_validator("chat")
        self._register_validator("feed")
        TOPIC_VALIDATORS["feed"] = Mock(return_value=True)

        handler = TopicHandler(self.consumer)
        handler.handle_subscribe({"topic": "chat.abc-123"})
        handler.handle_subscribe({"topic": "feed.xyz-456"})
        self.consumer.channel_layer.group_discard.reset_mock()

        handler.on_disconnect()

        discard_calls = self.consumer.channel_layer.group_discard.call_args_list
        discarded_groups = {call[0][0] for call in discard_calls}
        self.assertEqual(discarded_groups, {"topic.chat.abc-123", "topic.feed.xyz-456"})
