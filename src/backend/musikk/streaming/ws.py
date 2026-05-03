import time
from collections.abc import Callable

from websockets.action_handler import WSActionHandler

from streaming.managers.device_manager import DeviceManager
from streaming.managers.playback_manager import PlaybackManager
from streaming.state_broadcasters.device import DeviceStateBroadcaster
from streaming.state_broadcasters.playback import PlaybackStateBroadcaster
from streaming.state_broadcasters.player import PlayerStateBroadcaster

# TODO: add enums for user actions


class DeviceWSActionHandler(WSActionHandler):
    def __init__(self, consumer):
        super().__init__(consumer)
        self.device_id: str | None = None
        self.manager = DeviceManager(user_uuid=consumer.user_uuid)
        self.playback_manager = PlaybackManager(user_uuid=consumer.user_uuid)
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
            self.playback_manager.stop()
            self.player_broadcaster.broadcast_state(include_position=False)
        self.device_broadcaster.broadcast_devices()

    def handle_register(self, payload: dict):
        device_id = payload.get("device_id")
        device_name = payload.get("name")
        if not device_id or not device_name:
            self.consumer.send_error(
                "`device_id` and `name` are required for device.register"
            )
            return

        self.device_id = device_id
        self.consumer.device_id = device_id
        self.manager.register_device(device_id=device_id, name=device_name)
        self.device_broadcaster.broadcast_devices()

        self.player_broadcaster.send_state_to_channel(
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
            self.playback_manager.stop()
            self.player_broadcaster.broadcast_state(include_position=False)
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


class PlaybackWSActionHandler(WSActionHandler):
    # min gap between accepted ticks per connection
    MIN_TICK_INTERVAL = 1.5  # sec

    def __init__(self, consumer):
        super().__init__(consumer)
        self.manager = PlaybackManager(user_uuid=consumer.user_uuid)
        self.playback_broadcaster = PlaybackStateBroadcaster(
            user_uuid=consumer.user_uuid
        )
        self.device_manager = DeviceManager(user_uuid=self.consumer.user_uuid)
        self.device_broadcaster = DeviceStateBroadcaster(user_uuid=consumer.user_uuid)
        self._last_tick: float = 0.0

    def get_actions(self) -> dict[str, Callable]:
        return {
            "playback.activate": self.handle_activate,
            "playback.stop": self.handle_stop,
            "playback.seek": self.handle_seek,
            "playback.tick": self.handle_tick,
        }

    def handle_activate(self, payload: dict):
        self.playback_broadcaster.activate()

    def handle_stop(self, payload: dict):
        self.playback_broadcaster.stop()

    def handle_seek(self, payload: dict):
        position = self._parse_tick_position(payload)
        if position is None:
            return

        self._auto_activate_if_no_active_device()

        collection_song_uuid = payload.get("collection_song_uuid")
        self.manager.set_position(position, collection_song_uuid)
        self.playback_broadcaster.broadcast_seek(
            position,
            collection_song_uuid,
            exclude_device_id=self.consumer.device_id,
        )

    def _auto_activate_if_no_active_device(self):
        # we can seek on a device that isn't active yet
        # (and there's no other active device)
        device_id = self.consumer.device_id
        if not device_id:
            return
        if self.device_manager.get_active_device_id() is not None:
            return
        self.device_manager.set_active_device(device_id)
        self.device_broadcaster.broadcast_devices()

    def handle_tick(self, payload: dict):
        now = time.monotonic()
        if now - self._last_tick < self.MIN_TICK_INTERVAL:
            return

        position = self._parse_tick_position(payload)
        if position is None:
            return
        self._last_tick = now

        collection_song_uuid = payload.get("collection_song_uuid")
        self.manager.set_position(position, collection_song_uuid)
        self.playback_broadcaster.broadcast_tick(
            position,
            collection_song_uuid,
            exclude_device_id=self.consumer.device_id,
        )

    @staticmethod
    def _parse_tick_position(payload: dict) -> float | None:
        position = payload.get("position")
        if not isinstance(position, (int, float)) or position < 0:
            return None

        return float(position)
