from unittest.mock import Mock, patch, MagicMock, AsyncMock

from django.test import TestCase

from users.tests.factories import BaseUserFactory
from websockets.base_consumer import BaseConsumer


class TestEvents(TestCase):
    def setUp(self):
        self.user = BaseUserFactory.create()
        self.mock_redis = MagicMock()
        self.mock_channel_layer = MagicMock()
        self.mock_channel_layer.group_add = AsyncMock()
        self.mock_channel_layer.group_discard = AsyncMock()
        self.mock_channel_layer.group_send = AsyncMock()
        self.mock_channel_layer.send = AsyncMock()

        self.consumer = BaseConsumer()
        self.consumer.scope = {"user": self.user}
        self.consumer.channel_name = "test_channel"
        self.consumer.channel_layer = self.mock_channel_layer
        self.consumer.accept = Mock()
        self.consumer.close = Mock()
        self.consumer.send_json = Mock()

    @patch("websockets.base_consumer.DeviceManager")
    def test_connect_authenticated_user(self, mock_device_manager_class):
        self.consumer.connect()

        self.assertIsNotNone(self.consumer.user)
        self.assertEqual(self.consumer.user, self.user)
        self.assertEqual(self.consumer.user_uuid, str(self.user.uuid))
        self.assertEqual(self.consumer.group_name, f"user_{self.user.uuid}")

        self.mock_channel_layer.group_add.assert_called_once_with(
            f"user_{self.user.uuid}", "test_channel"
        )

        mock_device_manager_class.assert_called_once_with(user_uuid=str(self.user.uuid))

    def test_connect_anonymous_user(self):
        anonymous_user = Mock()
        anonymous_user.is_anonymous = True

        consumer = BaseConsumer()
        consumer.scope = {"user": anonymous_user}
        consumer.accept = Mock()

        consumer.connect()

        consumer.accept.assert_not_called()

    def test_device_register_action_is_called_and_sends_device_event(self):
        self.mock_redis.get.return_value = None

        self.consumer.user = self.user
        self.consumer.user_uuid = str(self.user.uuid)
        self.consumer.group_name = f"user_{self.user.uuid}"
        self.consumer.device_manager = Mock()
        self.consumer.device_manager.get_devices.return_value = [
            {"id": "device1", "name": "My Device", "is_active": False}
        ]

        payload = {"device_id": "device1", "name": "My Device"}
        self.consumer.handle_device_register(payload)

        self.consumer.device_manager.register_device.assert_called_once_with(
            device_id="device1", name="My Device"
        )

        self.mock_channel_layer.group_send.assert_called_once()
        call_args = self.mock_channel_layer.group_send.call_args
        self.assertEqual(call_args[0][0], f"user_{self.user.uuid}")
        self.assertEqual(call_args[0][1]["event"], "device.list")
        self.assertIn("devices", call_args[0][1]["payload"])

    def test_device_register_missing_device_id(self):
        self.consumer.user = self.user
        self.consumer.device_manager = Mock()

        payload = {"name": "My Device"}

        self.consumer.handle_device_register(payload)
        self.consumer.send_json.assert_called_once_with(
            {
                "event": "error",
                "payload": {"message": "'device_id' and 'name' are required for device.register"},
            }
        )
        self.consumer.device_manager.register_device.assert_not_called()

    def test_device_heartbeat(self):
        self.consumer.user = self.user
        self.consumer.user_uuid = str(self.user.uuid)
        self.consumer.device_manager = Mock()

        payload = {"device_id": "device1"}
        self.consumer.handle_device_heartbeat(payload)

        self.consumer.device_manager.touch_device.assert_called_once_with(
            device_id="device1"
        )

    def test_device_heartbeat_missing_device_id(self):
        self.consumer.user = self.user
        self.consumer.device_manager = Mock()

        self.consumer.handle_device_heartbeat({})
        self.consumer.send_json.assert_called_once_with(
            {
                "event": "error",
                "payload": {"message": "'device_id' is required for device.heartbeat"},
            }
        )
        self.consumer.device_manager.touch_device.assert_not_called()

    def test_device_set_active(self):
        self.consumer.user = self.user
        self.consumer.user_uuid = str(self.user.uuid)
        self.consumer.group_name = f"user_{self.user.uuid}"
        self.consumer.device_manager = Mock()
        self.consumer.device_manager.get_devices.return_value = [
            {"id": "device1", "name": "Device 1", "is_active": True},
            {"id": "device2", "name": "Device 2", "is_active": False},
        ]

        payload = {"device_id": "device1"}
        self.consumer.handle_device_set_active(payload)

        self.consumer.device_manager.set_active_device.assert_called_once_with(
            device_id="device1"
        )

        self.mock_channel_layer.group_send.assert_called_once()
        call_args = self.mock_channel_layer.group_send.call_args
        self.assertEqual(call_args[0][0], f"user_{self.user.uuid}")
        self.assertEqual(call_args[0][1]["event"], "device.list")

    def test_device_set_active_missing_device_id(self):
        self.consumer.user = self.user
        self.consumer.device_manager = Mock()

        self.consumer.handle_device_set_active({})
        self.consumer.send_json.assert_called_once_with(
            {
                "event": "error",
                "payload": {"message": "'device_id' is required for device.set_active"},
            }
        )
        self.consumer.device_manager.set_active_device.assert_not_called()

    def test_disconnect_clears_device_and_broadcasts(self):
        self.consumer.user = self.user
        self.consumer.user_uuid = str(self.user.uuid)
        self.consumer.group_name = f"user_{self.user.uuid}"
        self.consumer.device_id = "device1"
        self.consumer.device_manager = Mock()
        self.consumer.device_manager.get_devices.return_value = [
            {"id": "device2", "name": "Device 2", "is_active": False}
        ]

        self.consumer.disconnect(1000)

        self.consumer.device_manager.clear_device.assert_called_once_with("device1")

        self.mock_channel_layer.group_discard.assert_called_once_with(
            f"user_{self.user.uuid}", "test_channel"
        )

        self.mock_channel_layer.group_send.assert_called_once()
        call_args = self.mock_channel_layer.group_send.call_args
        self.assertEqual(call_args[0][0], f"user_{self.user.uuid}")
        self.assertEqual(call_args[0][1]["event"], "device.list")

    def test_broadcast_devices(self):
        self.consumer.user = self.user
        self.consumer.user_uuid = str(self.user.uuid)
        self.consumer.group_name = f"user_{self.user.uuid}"
        self.consumer.device_manager = Mock()

        devices = [
            {"id": "device1", "name": "Device 1", "is_active": True},
            {"id": "device2", "name": "Device 2", "is_active": False},
        ]
        self.consumer.device_manager.get_devices.return_value = devices

        self.consumer.broadcast_devices()

        self.consumer.device_manager.get_devices.assert_called_once()

        self.mock_channel_layer.group_send.assert_called_once_with(
            f"user_{self.user.uuid}",
            {
                "type": "ws_event",
                "event": "device.list",
                "payload": {
                    "devices": [
                        {"id": "device1", "name": "Device 1", "is_active": True},
                        {"id": "device2", "name": "Device 2", "is_active": False},
                    ]
                },
            },
        )

    def test_receive_json_missing_action(self):
        self.consumer.user = self.user
        self.consumer.device_manager = Mock()

        self.consumer.receive_json({"payload": {}})
        self.consumer.send_json.assert_called_once_with(
            {
                "event": "error",
                "payload": {"message": "Missing 'action' field"},
            }
        )

    def test_receive_json_unknown_action(self):
        self.consumer.user = self.user
        self.consumer.device_manager = Mock()

        self.consumer.receive_json({"action": "foo.bar"})
        self.consumer.send_json.assert_called_once_with(
            {
                "event": "error",
                "payload": {"message": "Unknown action: foo.bar"},
            }
        )
