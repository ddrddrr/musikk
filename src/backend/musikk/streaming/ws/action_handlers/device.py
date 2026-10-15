from websockets.action_handler import WSAction, WSActionHandler

from streaming.managers.device_manager import DeviceManager
from streaming.models.stored_playback_state import locked_stored_playback_state
from streaming.ws.player_controller import PlayerController
from streaming.ws.serializers import (
    DeviceRegisterSerializer,
    DeviceSetActiveSerializer,
    DeviceSetVolumeSerializer,
)
from streaming.ws.state_broadcasters.device import DeviceStateBroadcaster
from streaming.ws.state_broadcasters.playback import PlaybackStateBroadcaster


class DeviceWSActionHandler(WSActionHandler):
    def __init__(self, consumer):
        super().__init__(consumer)
        self.device_id: str | None = None
        self.manager = DeviceManager(user_uuid=consumer.user_uuid)
        self.player_controller = PlayerController(user_uuid=consumer.user_uuid)
        self.device_broadcaster = DeviceStateBroadcaster(user_uuid=consumer.user_uuid)
        self.playback_state_broadcaster = PlaybackStateBroadcaster(
            user_uuid=consumer.user_uuid
        )

    def get_actions(self) -> dict[str, WSAction]:
        return {
            "device.register": {
                "handler": self.handle_register,
                "serializer": DeviceRegisterSerializer,
                "on_invalid": "error",
            },
            "device.set_active": {
                "handler": self.handle_set_active,
                "serializer": DeviceSetActiveSerializer,
                "on_invalid": "error",
            },
            "device.set_volume": {
                "handler": self.handle_set_volume,
                "serializer": DeviceSetVolumeSerializer,
                "on_invalid": "error",
            },
        }

    # on_disconnect will be called when the ws connection is aborted, i.e,
    # when the device will stop sending ws pongs, i.e., become "dead"
    def on_disconnect(self):
        if not self.device_id:
            return
        was_active = self.manager.clear_device(
            device_id=self.device_id,
            channel_name=self.consumer.channel_name,
        )
        if was_active:
            # if the active device disconnected, stop playback so the next
            # device the user picks doesn't autoplay
            self.player_controller.pause()
        self.device_broadcaster.broadcast_devices()

    def handle_register(self, payload: dict):
        device_id = payload["device_id"]
        self.device_id = device_id
        self.consumer.device_id = device_id
        self.manager.register_device(channel_name=self.consumer.channel_name, **payload)
        self.device_broadcaster.broadcast_devices()

        # the playback snapshot is not broadcast on every register since it doesn't change
        # but the new device needs to now the initial values, so we send it directly
        with locked_stored_playback_state(
            self.consumer.user_uuid
        ) as stored_playback_state:
            self.playback_state_broadcaster.send_snapshot_to_channel(
                self.consumer.channel_layer,
                self.consumer.channel_name,
                stored_playback_state,
            )

    def handle_set_active(self, payload: dict):
        # stop the playback and only then broadcast new devices
        changed = self.manager.set_active_device(device_id=payload["device_id"])
        if changed:
            self.player_controller.pause()
        self.device_broadcaster.broadcast_devices()

    def handle_set_volume(self, payload: dict):
        self.manager.set_device_volume(
            device_id=payload["device_id"], volume=payload["volume"]
        )
        self.device_broadcaster.broadcast_devices()
