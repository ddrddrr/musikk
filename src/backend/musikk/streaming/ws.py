from collections.abc import Callable
from enum import StrEnum

from asgiref.sync import async_to_sync as atos

from streaming.managers.device_manager import DeviceManager
from streaming.managers.playback_manager import PlaybackManager
from websockets.action_handler import WSActionHandler


class ServerEvent(StrEnum):
    DEVICE_LIST = "device.list"
    PLAYBACK_CHANGE = "playback.change"
    QUEUE_CHANGED = "queue.changed"
    # TODO: rename to collection open changed
    COLLECTION_CHANGED = "collection.changed"
    COLLECTIONS_PERSONAL_CHANGED = "collections.personal.changed"
    SONG_UPLOAD = "song.upload"
    FRIEND_ACTIVITY_LISTENING_CHANGED = "friend-activity.listening.changed"


class DeviceHandler(WSActionHandler):
    def __init__(self, consumer):
        super().__init__(consumer)
        self.device_id: str | None = None
        self.manager = DeviceManager(user_uuid=consumer.user_uuid)

    def get_actions(self) -> dict[str, Callable]:
        return {
            "device.register": self.handle_register,
            "device.set_active": self.handle_set_active,
            "device.heartbeat": self.handle_heartbeat,
        }

    def on_disconnect(self):
        if self.device_id:
            self.manager.clear_device(self.device_id)
            self._broadcast_devices()

    def handle_register(self, payload: dict):
        device_id = payload.get("device_id")
        device_name = payload.get("name")
        if not device_id or not device_name:
            self.consumer.send_error(
                "'device_id' and 'name' are required for device.register"
            )
            return

        self.device_id = device_id
        self.manager.register_device(device_id=device_id, name=device_name)
        self._broadcast_devices()

    def handle_set_active(self, payload: dict):
        device_id = payload.get("device_id")
        if not device_id:
            self.consumer.send_error("'device_id' is required for device.set_active")
            return

        self.manager.set_active_device(device_id=device_id)
        self._broadcast_devices()

    def handle_heartbeat(self, payload: dict):
        device_id = payload.get("device_id")
        if not device_id:
            self.consumer.send_error("'device_id' is required for device.heartbeat")
            return

        self.manager.touch_device(device_id=device_id)
        self._broadcast_devices()

    def _broadcast_devices(self):
        devices = self.manager.get_devices()
        atos(self.consumer.channel_layer.group_send)(
            self.consumer.group_name,
            {
                "type": "ws_event",
                "event": ServerEvent.DEVICE_LIST,
                "payload": {"devices": devices},
            },
        )


class PlaybackHandler(WSActionHandler):
    def __init__(self, consumer):
        super().__init__(consumer)
        self.manager = PlaybackManager(user_uuid=consumer.user_uuid)

    def get_actions(self) -> dict[str, Callable]:
        return {
            "playback.activate": self.handle_activate,
            "playback.stop": self.handle_stop,
        }

    def handle_activate(self, payload: dict):
        self.manager.activate()
        self._broadcast_state()

    def handle_stop(self, payload: dict):
        self.manager.stop()
        self._broadcast_state()

    def _broadcast_state(self):
        atos(self.consumer.channel_layer.group_send)(
            self.consumer.group_name,
            {
                "type": "ws_event",
                "event": ServerEvent.PLAYBACK_CHANGE,
                "payload": {"playback": self.manager.is_playback_active()},
            },
        )
