from collections.abc import Callable

from websockets.action_handler import WSActionHandler

from streaming.managers.device_manager import DeviceManager
from streaming.ws.playback_controller import PlaybackController
from streaming.ws.state_broadcasters.device import DeviceStateBroadcaster
from streaming.ws.state_broadcasters.player import PlayerStateBroadcaster


class DeviceWSActionHandler(WSActionHandler):
    def __init__(self, consumer):
        super().__init__(consumer)
        self.device_id: str | None = None
        self.manager = DeviceManager(user_uuid=consumer.user_uuid)
        self.playback_controller = PlaybackController(user_uuid=consumer.user_uuid)
        self.device_broadcaster = DeviceStateBroadcaster(user_uuid=consumer.user_uuid)
        self.player_broadcaster = PlayerStateBroadcaster(user_uuid=consumer.user_uuid)

    def get_actions(self) -> dict[str, Callable]:
        return {
            "device.register": self.handle_register,
            "device.set_active": self.handle_set_active,
            "device.set_volume": self.handle_set_volume,
            "device.heartbeat": self.handle_heartbeat,
        }

    def on_disconnect(self):
        if not self.device_id:
            return
        was_active = self.manager.clear_device(self.device_id)
        if was_active:
            # if the active device disconnected, stop playback so the next
            # device the user picks doesn't autoplay
            self.playback_controller.stop()
        self.device_broadcaster.broadcast_devices()

    def handle_register(self, payload: dict):
        device_id = payload.get("device_id")
        device_name = payload.get("name")
        if not device_id or not device_name:
            self.consumer.send_error(
                "`device_id` and `name` are required for device.register"
            )
            return

        # FE owns the durable per-device volume in localStorage; BE state is
        # volatile (TTL + cleared on disconnect) so the FE re-asserts it here
        register_kwargs = {"device_id": device_id, "name": device_name}
        volume = payload.get("volume")
        if isinstance(volume, int) and 0 <= volume <= 100:
            register_kwargs["volume"] = volume

        self.device_id = device_id
        self.consumer.device_id = device_id
        self.manager.register_device(**register_kwargs)
        self.device_broadcaster.broadcast_devices()

        self.player_broadcaster.send_snapshot_to_channel(
            self.consumer.channel_layer, self.consumer.channel_name
        )
        self.device_broadcaster.send_devices_to_channel(
            self.consumer.channel_layer, self.consumer.channel_name
        )

    def handle_set_active(self, payload: dict):
        device_id = payload.get("device_id")
        if not device_id:
            self.consumer.send_error("`device_id` is required for device.set_active")
            return

        # stop the playback and only then broadcast new devices
        changed = self.manager.set_active_device(device_id=device_id)
        if changed:
            self.playback_controller.stop()
        self.device_broadcaster.broadcast_devices()

    def handle_set_volume(self, payload: dict):
        device_id = payload.get("device_id")
        volume = payload.get("volume")
        if not device_id or volume is None:
            self.consumer.send_error(
                "`device_id` and `volume` are required for device.set_volume"
            )
            return

        if not isinstance(volume, int) or not (0 <= volume <= 100):
            self.consumer.send_error("`volume` must be an integer between 0 and 100")
            return

        self.manager.set_device_volume(device_id=device_id, volume=volume)
        self.device_broadcaster.broadcast_devices()

    def handle_heartbeat(self, payload: dict):
        device_id = payload.get("device_id")
        if not device_id:
            self.consumer.send_error("`device_id` is required for device.heartbeat")
            return

        self.manager.touch_device(device_id=device_id)
        self.device_broadcaster.broadcast_devices()
