from unittest.mock import AsyncMock, MagicMock, Mock, patch

from django.test import TestCase
from rest_framework import serializers
from social.ws import TypingWSActionService
from streaming.models import StoredPlaybackState
from streaming.tests.factories import CollectionSongFactory
from streaming.ws.action_services.device import DeviceWSActionService
from streaming.ws.action_services.playback import PlaybackWSActionService
from streaming.ws.events import ServerEvent
from streaming.ws.state_broadcasters.device import DeviceStateBroadcaster
from streaming.ws.state_broadcasters.playback import PlaybackStateBroadcaster
from users.tests.factories import BaseUserFactory

from websockets.action_service import WSAction, WSActionService
from websockets.base_consumer import BaseConsumer
from websockets.topics import TOPIC_VALIDATORS, TopicWSActionService

PLAY_ITEM_UNIQUE_ID = "11111111-1111-1111-1111-111111111111"
OLD_PLAY_ITEM_UNIQUE_ID = "22222222-2222-2222-2222-222222222222"
TOPIC_ID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b"
OTHER_TOPIC_ID = "7d6c5b4a-3e2f-4a1b-9c8d-0e1f2a3b4c5d"
CHAT_GROUP = f"topic.chat.{TOPIC_ID}"


class _PayloadSerializer(serializers.Serializer):
    key = serializers.CharField(required=False)


def _action(handler, on_invalid="error") -> WSAction:
    return {
        "handler": handler,
        "serializer": _PayloadSerializer,
        "on_invalid": on_invalid,
    }


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

    @patch("streaming.ws.action_services.device.DeviceManager")
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
            {
                name: action["on_invalid"]
                for name, action in self.consumer._action_map.items()
            },
            {
                "device.register": "error",
                "device.set_active": "error",
                "device.set_volume": "error",
                "playback.set": "drop",
                "playback.active-device-report": "drop",
                "subscribe": "error",
                "unsubscribe": "drop",
                "typing": "drop",
            },
        )

    def test_connect_anonymous_user(self):
        anonymous_user = Mock()
        anonymous_user.is_anonymous = True

        consumer = _make_consumer(anonymous_user)
        consumer.connect()

        consumer.accept.assert_not_called()

    @patch("streaming.ws.action_services.device.DeviceManager")
    def test_connect_group_add_failure_returns_early(self, _mock_device):
        self.consumer.channel_layer.group_add = AsyncMock(
            side_effect=Exception("redis down")
        )

        self.consumer.connect()

        self.consumer.accept.assert_not_called()
        self.assertEqual(self.consumer._action_map, {})

    @patch("streaming.ws.action_services.device.DeviceManager")
    def test_connect_raises_on_action_collision(self, _mock_device):
        class DuplicateService(WSActionService):
            def get_actions(self):
                return {"device.register": _action(Mock())}

        self.consumer.action_service_classes = [DeviceWSActionService, DuplicateService]

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

    def test_receive_json_message_that_is_not_an_object(self):
        self.consumer.receive_json(["test.action"])

        self.consumer.send_json.assert_called_once_with(
            {"event": "error", "payload": {"message": "Expected a JSON object"}}
        )

    def test_receive_json_action_that_is_not_a_string(self):
        self.consumer._action_map = {}

        self.consumer.receive_json({"action": ["test.action"]})

        self.consumer.send_json.assert_called_once_with(
            {
                "event": "error",
                "payload": {"message": "Unknown action: ['test.action']"},
            }
        )

    def test_receive_json_passes_validated_data_to_handler(self):
        handler_fn = Mock()
        self.consumer._action_map = {"test.action": _action(handler_fn)}

        self.consumer.receive_json(
            {"action": "test.action", "payload": {"key": "value", "unknown": 1}}
        )

        handler_fn.assert_called_once_with({"key": "value"})
        self.consumer.send_json.assert_not_called()

    def test_receive_json_validates_missing_payload_as_empty(self):
        handler_fn = Mock()
        self.consumer._action_map = {"test.action": _action(handler_fn)}

        self.consumer.receive_json({"action": "test.action"})

        handler_fn.assert_called_once_with({})

    def test_receive_json_invalid_payload_sends_error(self):
        handler_fn = Mock()
        self.consumer._action_map = {"test.action": _action(handler_fn, "error")}

        self.consumer.receive_json({"action": "test.action", "payload": {"key": ""}})

        handler_fn.assert_not_called()
        self.consumer.send_json.assert_called_once_with(
            {
                "event": "error",
                "payload": {
                    "message": "Invalid test.action payload: key: This field may not be blank."
                },
            }
        )

    def test_receive_json_payload_that_is_not_an_object_sends_error(self):
        handler_fn = Mock()
        self.consumer._action_map = {"test.action": _action(handler_fn, "error")}

        self.consumer.receive_json({"action": "test.action", "payload": ["value"]})

        handler_fn.assert_not_called()
        self.consumer.send_json.assert_called_once_with(
            {
                "event": "error",
                "payload": {
                    "message": "Invalid test.action payload: non_field_errors: "
                    "Invalid data. Expected a dictionary, but got list."
                },
            }
        )

    def test_receive_json_invalid_payload_is_dropped(self):
        handler_fn = Mock()
        self.consumer._action_map = {"test.action": _action(handler_fn, "drop")}

        self.consumer.receive_json({"action": "test.action", "payload": {"key": ""}})

        handler_fn.assert_not_called()
        self.consumer.send_json.assert_not_called()

    @patch("streaming.ws.action_services.device.DeviceManager")
    def test_disconnect_discards_group_and_calls_services(self, _mock_device):
        self.consumer.connect()
        self.consumer.channel_layer.group_discard.reset_mock()

        self.consumer.disconnect(close_code=1000)

        self.consumer.channel_layer.group_discard.assert_called_once_with(
            f"user_{self.user.uuid}", "test_channel"
        )

    def test_disconnect_without_group_name_skips_discard(self):
        self.consumer.group_name = None
        self.consumer._action_services = []

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


class TestDeviceWSActionService(TestCase):
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

    @patch("streaming.ws.action_services.device.DeviceManager")
    def test_register_calls_manager(self, mock_manager_cls):
        service = DeviceWSActionService(self.consumer)
        service.handle_register({"device_id": "device1", "name": "My Device"})

        mock_manager_cls.return_value.register_device.assert_called_once_with(
            device_id="device1",
            channel_name=self.consumer.channel_name,
            name="My Device",
        )
        self.assertEqual(service.device_id, "device1")
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

    @patch("streaming.ws.action_services.device.DeviceManager")
    def test_register_forwards_valid_volume(self, mock_manager_cls):
        # FE owns the durable per-device volume in localStorage; without this
        # forwarding, register would re-hydrate Redis at DEFAULT_VOLUME and
        # subsequent device.list broadcasts would clobber the FE state
        service = DeviceWSActionService(self.consumer)
        service.handle_register(
            {"device_id": "device1", "name": "My Device", "volume": 42}
        )

        mock_manager_cls.return_value.register_device.assert_called_once_with(
            device_id="device1",
            channel_name=self.consumer.channel_name,
            name="My Device",
            volume=42,
        )

    @patch("streaming.ws.action_services.device.DeviceManager")
    def test_set_active_changed_pauses_playback(self, mock_manager_cls):
        mock_manager = mock_manager_cls.return_value
        mock_manager.set_active_device.return_value = True

        parent = Mock()
        parent.attach_mock(mock_manager, "device")
        parent.attach_mock(self.mock_pause, "pause")
        parent.attach_mock(self.mock_broadcast_state, "broadcast_state")
        parent.attach_mock(self.mock_broadcast_devices, "broadcast_devices")

        service = DeviceWSActionService(self.consumer)
        service.handle_set_active({"device_id": "device1"})

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

    @patch("streaming.ws.action_services.device.DeviceManager")
    def test_set_active_no_change_does_not_pause_playback(self, mock_manager_cls):
        mock_manager = mock_manager_cls.return_value
        mock_manager.set_active_device.return_value = False

        service = DeviceWSActionService(self.consumer)
        service.handle_set_active({"device_id": "device1"})

        mock_manager.set_active_device.assert_called_once_with(device_id="device1")
        self.mock_pause.assert_not_called()
        # nothing changed -> only device.list update (e.g. for clients that
        # care about the device touch); no snapshot
        self.mock_broadcast_state.assert_not_called()
        self.mock_broadcast_devices.assert_called_once_with()

    @patch("streaming.ws.action_services.device.DeviceManager")
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

        service = DeviceWSActionService(self.consumer)
        service.device_id = "device1"
        service.on_disconnect()

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

    @patch("streaming.ws.action_services.device.DeviceManager")
    def test_disconnect_clears_non_active_device_does_not_pause_playback(
        self, mock_manager_cls
    ):
        mock_manager = mock_manager_cls.return_value
        mock_manager.clear_device.return_value = False

        service = DeviceWSActionService(self.consumer)
        service.device_id = "device1"
        service.on_disconnect()

        mock_manager.clear_device.assert_called_once_with(
            device_id="device1", channel_name=self.consumer.channel_name
        )
        self.mock_pause.assert_not_called()
        # only the device list changed; no need to re-broadcast the playback state
        self.mock_broadcast_state.assert_not_called()
        self.mock_broadcast_devices.assert_called_once_with()

    @patch("streaming.ws.action_services.device.DeviceManager")
    def test_disconnect_without_device_id_is_noop(self, mock_manager_cls):
        service = DeviceWSActionService(self.consumer)
        service.on_disconnect()

        mock_manager_cls.return_value.clear_device.assert_not_called()
        self.mock_pause.assert_not_called()
        self.mock_broadcast_state.assert_not_called()
        self.mock_broadcast_devices.assert_not_called()


class TestPlaybackWSActionService(TestCase):
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
            "streaming.ws.action_services.playback.DeviceManager"
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

    def test_set_forwards_command_to_active_device(self):
        service = PlaybackWSActionService(self.consumer)
        service.handle_set(
            {
                "is_playing": False,
                "song_pos_ms": 5000,
                "curr_play_item_unique_id": PLAY_ITEM_UNIQUE_ID,
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

    def test_set_forwards_play_state_without_seek(self):
        service = PlaybackWSActionService(self.consumer)
        service.handle_set({"is_playing": True})

        self._assert_command_sent("active_channel", {"is_playing": True})

    def test_set_is_dropped_when_no_playback_is_stored(self):
        self.stored_playback_state.curr_play_item_unique_id = None
        self.stored_playback_state.save()

        service = PlaybackWSActionService(self.consumer)
        service.handle_set({"is_playing": True})

        self.consumer.channel_layer.send.assert_not_called()

    def test_seek_with_stale_play_item_is_dropped(self):
        # the tab has not seen the latest track change yet
        self.mock_device_manager.get_active_device_channel.return_value = None

        service = PlaybackWSActionService(self.consumer)
        service.handle_set(
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

        service = PlaybackWSActionService(self.consumer)
        service.handle_set(
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

        service = PlaybackWSActionService(self.consumer)
        service.handle_set({"is_playing": True})

        self.mock_device_manager.set_active_device.assert_not_called()
        self.mock_broadcast_devices.assert_not_called()
        self.consumer.channel_layer.send.assert_not_called()

    def test_report_from_active_device_is_stored_and_broadcast(self):
        service = PlaybackWSActionService(self.consumer)
        service.handle_active_device_report(
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

        service = PlaybackWSActionService(self.consumer)
        service.handle_active_device_report(
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

        service = PlaybackWSActionService(self.consumer)
        service.handle_active_device_report(
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

        service = PlaybackWSActionService(self.consumer)
        service.handle_active_device_report(
            {
                "curr_play_item_unique_id": OLD_PLAY_ITEM_UNIQUE_ID,
                "is_playing": False,
                "song_pos_ms": 42500,
            }
        )

        self.mock_broadcast_state.assert_not_called()


class TestTopicWSActionService(TestCase):
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

        service = TopicWSActionService(self.consumer)
        service.handle_subscribe({"topic": ("chat", TOPIC_ID)})

        TOPIC_VALIDATORS["chat"].assert_called_once_with(self.user, TOPIC_ID)
        self.consumer.channel_layer.group_add.assert_called_once_with(
            CHAT_GROUP, "test_channel"
        )
        self.assertIn(CHAT_GROUP, self.consumer.subscribed_topics)

    def test_subscribe_unknown_prefix(self):
        service = TopicWSActionService(self.consumer)
        service.handle_subscribe({"topic": ("unknown", TOPIC_ID)})

        self.consumer.send_error.assert_called_once_with("Unknown topic type: unknown")

    def test_subscribe_validator_denies(self):
        self._register_validator("chat", return_value=False)

        service = TopicWSActionService(self.consumer)
        service.handle_subscribe({"topic": ("chat", TOPIC_ID)})

        self.consumer.send_error.assert_called_once_with(
            f"Not authorized for chat.{TOPIC_ID}"
        )
        self.consumer.channel_layer.group_add.assert_not_called()
        self.assertEqual(self.consumer.subscribed_topics, set())

    def test_unsubscribe_subscribed_group(self):
        self._register_validator("chat")

        service = TopicWSActionService(self.consumer)
        service.handle_subscribe({"topic": ("chat", TOPIC_ID)})
        self.consumer.channel_layer.group_add.reset_mock()

        service.handle_unsubscribe({"topic": ("chat", TOPIC_ID)})

        self.consumer.channel_layer.group_discard.assert_called_once_with(
            CHAT_GROUP, "test_channel"
        )
        self.assertNotIn(CHAT_GROUP, self.consumer.subscribed_topics)

    def test_unsubscribe_non_subscribed_group_is_noop(self):
        self._register_validator("chat")

        service = TopicWSActionService(self.consumer)
        service.handle_unsubscribe({"topic": ("chat", TOPIC_ID)})

        self.consumer.channel_layer.group_discard.assert_not_called()

    def test_on_disconnect_discards_all_subscribed_groups(self):
        self._register_validator("chat")
        self._register_validator("collection_comments")

        service = TopicWSActionService(self.consumer)
        service.handle_subscribe({"topic": ("chat", TOPIC_ID)})
        service.handle_subscribe({"topic": ("collection_comments", OTHER_TOPIC_ID)})
        self.consumer.channel_layer.group_discard.reset_mock()

        service.on_disconnect()

        discard_calls = self.consumer.channel_layer.group_discard.call_args_list
        discarded_groups = {call[0][0] for call in discard_calls}
        self.assertEqual(
            discarded_groups,
            {CHAT_GROUP, f"topic.collection_comments.{OTHER_TOPIC_ID}"},
        )
        self.assertEqual(self.consumer.subscribed_topics, set())


class TestTypingWSActionService(TestCase):
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
        self.consumer.subscribed_topics = {CHAT_GROUP}

    def test_typing_broadcasts_when_subscribed(self):
        service = TypingWSActionService(self.consumer)

        service.handle_typing({"topic": ("chat", TOPIC_ID)})

        self.consumer.channel_layer.group_send.assert_called_once_with(
            CHAT_GROUP,
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
        service = TypingWSActionService(self.consumer)

        service.handle_typing({"topic": ("chat", TOPIC_ID)})

        self.consumer.channel_layer.group_send.assert_not_called()

    def test_typing_dropped_for_prefix_without_registered_event(self):
        self.consumer.subscribed_topics = {f"topic.unknown.{OTHER_TOPIC_ID}"}
        service = TypingWSActionService(self.consumer)

        service.handle_typing({"topic": ("unknown", OTHER_TOPIC_ID)})

        self.consumer.channel_layer.group_send.assert_not_called()

    @patch("social.ws.time.monotonic")
    def test_typing_throttled_within_min_interval(self, mock_monotonic):
        mock_monotonic.return_value = 100.0
        service = TypingWSActionService(self.consumer)

        service.handle_typing({"topic": ("chat", TOPIC_ID)})
        mock_monotonic.return_value = 100.0 + TypingWSActionService.MIN_INTERVAL - 0.5
        service.handle_typing({"topic": ("chat", TOPIC_ID)})

        self.consumer.channel_layer.group_send.assert_called_once()

    @patch("social.ws.time.monotonic")
    def test_typing_accepted_after_min_interval(self, mock_monotonic):
        mock_monotonic.return_value = 100.0
        service = TypingWSActionService(self.consumer)

        service.handle_typing({"topic": ("chat", TOPIC_ID)})
        mock_monotonic.return_value = 100.0 + TypingWSActionService.MIN_INTERVAL + 0.1
        service.handle_typing({"topic": ("chat", TOPIC_ID)})

        self.assertEqual(self.consumer.channel_layer.group_send.call_count, 2)
