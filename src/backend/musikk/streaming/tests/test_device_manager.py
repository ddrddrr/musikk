import json
from unittest.mock import call, patch

from django.test import TestCase

from streaming.managers.device_manager import DeviceManager


class TestDeviceManager(TestCase):
    USER_UUID = "11111111-1111-1111-1111-111111111111"

    def setUp(self):
        self.redis_patcher = patch(
            "streaming.managers.device_manager.get_default_redis_conn"
        )
        self.mock_redis = self.redis_patcher.start().return_value
        self.addCleanup(self.redis_patcher.stop)

        self.manager = DeviceManager(user_uuid=self.USER_UUID)

    def test_set_active_device_returns_true_when_changed(self):
        self.mock_redis.get.return_value = None

        self.assertTrue(self.manager.set_active_device(device_id="d1"))

    def test_set_active_device_returns_false_when_unchanged(self):
        self.mock_redis.get.return_value = b"d1"

        self.assertFalse(self.manager.set_active_device(device_id="d1"))

    def test_get_active_device_channel_returns_channel_of_active_device(self):
        device = json.dumps({"channel_name": "chA", "name": "n", "volume": 50})
        self.mock_redis.get.side_effect = [b"d1", device.encode()]

        self.assertEqual(self.manager.get_active_device_channel(), "chA")
        self.mock_redis.get.assert_called_with(self.manager._device_key("d1"))

    def test_get_active_device_channel_returns_none_without_active_device(self):
        self.mock_redis.get.return_value = None

        self.assertIsNone(self.manager.get_active_device_channel())

    def test_get_active_device_channel_returns_none_when_device_entry_is_gone(self):
        self.mock_redis.get.side_effect = [b"d1", None]

        self.assertIsNone(self.manager.get_active_device_channel())

    def test_clear_device_returns_true_when_was_active(self):
        owned = json.dumps({"channel_name": "chA", "name": "n", "volume": 50})
        self.mock_redis.get.side_effect = [owned.encode(), b"d1"]

        self.assertTrue(self.manager.clear_device("d1", channel_name="chA"))
        self.mock_redis.delete.assert_any_call(
            self.manager._device_key("d1"),
        )
        self.mock_redis.srem.assert_called_once_with(
            self.manager._devices_set_key(), "d1"
        )

    def test_clear_device_returns_false_when_was_not_active(self):
        owned = json.dumps({"channel_name": "chA", "name": "n", "volume": 50})
        self.mock_redis.get.side_effect = [owned.encode(), b"other"]

        self.assertFalse(self.manager.clear_device("d1", channel_name="chA"))

    def test_clear_device_no_op_when_channel_does_not_own(self):
        # late PING-timeout disconnect from the dead channel must not wipe
        # the entry that the freshly-reconnected channel just registered
        owned_by_b = json.dumps({"channel_name": "chB", "name": "n", "volume": 50})
        self.mock_redis.get.return_value = owned_by_b.encode()

        self.assertFalse(self.manager.clear_device("d1", channel_name="chA"))
        self.mock_redis.delete.assert_not_called()
        self.mock_redis.srem.assert_not_called()

    def test_clear_all_devices_deletes_entries_and_sets_but_keeps_active_device(self):
        keys_by_pattern = {
            "user:*:device:*": [b"user:u1:device:d1", b"user:u2:device:d2"],
            "user:*:devices": [b"user:u1:devices", b"user:u2:devices"],
        }
        self.mock_redis.scan_iter.side_effect = lambda match: iter(
            keys_by_pattern[match]
        )

        DeviceManager.clear_all_devices()

        self.assertEqual(
            self.mock_redis.delete.call_args_list,
            [
                call(b"user:u1:device:d1", b"user:u2:device:d2"),
                call(b"user:u1:devices", b"user:u2:devices"),
            ],
        )

    def test_clear_all_devices_skips_delete_without_devices(self):
        self.mock_redis.scan_iter.return_value = iter([])

        DeviceManager.clear_all_devices()

        self.mock_redis.delete.assert_not_called()
