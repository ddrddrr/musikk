import time
from collections.abc import Callable

from websockets.action_handler import WSActionHandler

from streaming.managers.device_manager import DeviceManager
from streaming.managers.playback_manager import PlaybackManager
from streaming.ws.state_broadcasters.device import DeviceStateBroadcaster
from streaming.ws.state_broadcasters.playback import PlaybackStateBroadcaster


class PlaybackWSActionHandler(WSActionHandler):
    # min gap between accepted ticks per connection
    MIN_TICK_INTERVAL = 1.5  # sec

    def __init__(self, consumer):
        super().__init__(consumer)
        self.manager = PlaybackManager(user_uuid=consumer.user_uuid)
        self.playback_broadcaster = PlaybackStateBroadcaster(
            user_uuid=consumer.user_uuid
        )
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
        device_manager = DeviceManager(user_uuid=self.consumer.user_uuid)
        if device_manager.get_active_device_id() is not None:
            return
        device_manager.set_active_device(device_id)
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
