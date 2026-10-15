from collections.abc import Callable

from websockets.action_handler import WSActionHandler

from streaming.managers.device_manager import DeviceManager
from streaming.models.stored_playback_state import locked_stored_playback_state
from streaming.ws.player_controller import PlayerController
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

    def get_actions(self) -> dict[str, Callable]:
        return {
            "device.register": self.handle_register,
            "device.set_active": self.handle_set_active,
            "device.set_volume": self.handle_set_volume,
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
        device_id = payload.get("device_id")
        device_name = payload.get("name")
        if not device_id or not device_name:
            self.consumer.send_error(
                "`device_id` and `name` are required for device.register"
            )
            return

        register_kwargs = {
            "device_id": device_id,
            "channel_name": self.consumer.channel_name,
            "name": device_name,
        }
        volume = payload.get("volume")
        if isinstance(volume, int) and 0 <= volume <= 100:
            register_kwargs["volume"] = volume

        self.device_id = device_id
        self.consumer.device_id = device_id
        self.manager.register_device(**register_kwargs)
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
        device_id = payload.get("device_id")
        if not device_id:
            self.consumer.send_error("`device_id` is required for device.set_active")
            return

        # stop the playback and only then broadcast new devices
        changed = self.manager.set_active_device(device_id=device_id)
        if changed:
            self.player_controller.pause()
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
