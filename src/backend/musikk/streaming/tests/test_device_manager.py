from unittest.mock import patch

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

    def test_clear_device_returns_true_when_was_active(self):
        self.mock_redis.get.return_value = b"d1"

        self.assertTrue(self.manager.clear_device("d1"))

    def test_clear_device_returns_false_when_was_not_active(self):
        self.mock_redis.get.return_value = b"other"

        self.assertFalse(self.manager.clear_device("d1"))
