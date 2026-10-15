from django.test import SimpleTestCase

from streaming.audio.config import MAX_DURATION_SECONDS
from streaming.ws.serializers import (
    ActiveDeviceReportSerializer,
    DeviceRegisterSerializer,
    DeviceSetActiveSerializer,
    DeviceSetVolumeSerializer,
    PlaybackSetSerializer,
)

PLAY_ITEM_UNIQUE_ID = "11111111-1111-1111-1111-111111111111"


def _seek(song_pos_ms) -> dict:
    return {"song_pos_ms": song_pos_ms, "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID}


def _report(**fields) -> dict:
    return {
        "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID,
        "is_playing": False,
        "song_pos_ms": 1,
        **fields,
    }


class SerializerAssertions(SimpleTestCase):
    def assert_valid(self, serializer_class, payload: dict, expected: dict) -> None:
        serializer = serializer_class(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data, expected)

    def assert_all_invalid(self, serializer_class, payloads: list) -> None:
        for payload in payloads:
            with self.subTest(payload=payload):
                self.assertFalse(serializer_class(data=payload).is_valid())


class TestDeviceSerializers(SerializerAssertions):
    def test_register_accepts_device_without_volume(self):
        self.assert_valid(
            DeviceRegisterSerializer,
            {"device_id": "a1b2", "name": "My Device"},
            {"device_id": "a1b2", "name": "My Device"},
        )

    def test_register_accepts_device_with_volume(self):
        self.assert_valid(
            DeviceRegisterSerializer,
            {"device_id": "a1b2", "name": "My Device", "volume": 42},
            {"device_id": "a1b2", "name": "My Device", "volume": 42},
        )

    def test_register_rejects_invalid_payloads(self):
        self.assert_all_invalid(
            DeviceRegisterSerializer,
            [
                {"name": "My Device"},
                {"device_id": "a1b2"},
                {"device_id": "", "name": "My Device"},
                {"device_id": "a1b2", "name": "My Device", "volume": 150},
                {"device_id": "a1b2", "name": "My Device", "volume": -1},
                {"device_id": "a1b2", "name": "My Device", "volume": "loud"},
                ["a1b2", "My Device"],
            ],
        )

    def test_set_active_rejects_missing_device_id(self):
        self.assert_all_invalid(DeviceSetActiveSerializer, [{}, {"device_id": None}])

    def test_set_volume_accepts_volume_in_range(self):
        self.assert_valid(
            DeviceSetVolumeSerializer,
            {"device_id": "a1b2", "volume": 0},
            {"device_id": "a1b2", "volume": 0},
        )

    def test_set_volume_rejects_invalid_payloads(self):
        self.assert_all_invalid(
            DeviceSetVolumeSerializer,
            [
                {"device_id": "a1b2"},
                {"volume": 50},
                {"device_id": "a1b2", "volume": 101},
            ],
        )


class TestPlaybackSetSerializer(SerializerAssertions):
    def test_accepts_play_state_seek_or_both(self):
        for payload in [
            {"is_playing": True},
            _seek(5000),
            {"is_playing": False, **_seek(5000)},
        ]:
            with self.subTest(payload=payload):
                self.assert_valid(PlaybackSetSerializer, payload, payload)

    def test_ignores_unknown_keys(self):
        self.assert_valid(
            PlaybackSetSerializer,
            {"is_playing": False, "volume": 10},
            {"is_playing": False},
        )

    def test_rejects_invalid_payloads(self):
        self.assert_all_invalid(
            PlaybackSetSerializer,
            [
                {},
                {"song_pos_ms": 5000},
                {"is_playing": True, "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID},
                _seek(-1),
                _seek("wat"),
                _seek(float("nan")),
                _seek(float("inf")),
                _seek(MAX_DURATION_SECONDS * 1000 + 1),
                {"is_playing": True, **_seek(-1)},
            ],
        )


class TestActiveDeviceReportSerializer(SerializerAssertions):
    def test_accepts_full_report(self):
        report = {
            "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID,
            "is_playing": False,
            "song_pos_ms": MAX_DURATION_SECONDS * 1000,
        }
        self.assert_valid(ActiveDeviceReportSerializer, report, report)

    def test_rejects_invalid_payloads(self):
        self.assert_all_invalid(
            ActiveDeviceReportSerializer,
            [
                {"is_playing": False, "song_pos_ms": 1},
                {"curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID, "song_pos_ms": 1},
                {"curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID, "is_playing": False},
                _report(song_pos_ms=-1),
                _report(song_pos_ms=MAX_DURATION_SECONDS * 1000 + 1),
                _report(song_pos_ms=float("nan")),
            ],
        )
