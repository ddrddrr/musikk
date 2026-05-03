from asgiref.sync import async_to_sync as atos
from websockets.event_helpers import send_ws_event, user_group

from streaming.events import ServerEvent
from streaming.managers.device_manager import DeviceManager


class DeviceStateBroadcaster:
    """
    Broadcasts the device list as a standalone event.

    Why: device-only mutations (heartbeat, set_volume, disconnect) used to ride
    on the player snapshot, which also re-serializes the current song.
    Heartbeats fire every few seconds per device, so that scaled badly.
    Splitting the events keeps each broadcast cheap and one-concern.
    """

    def __init__(self, user_uuid: str):
        self.user_uuid = user_uuid
        self._manager = DeviceManager(user_uuid=user_uuid)

    def broadcast_devices(self) -> None:
        send_ws_event(
            user_group(self.user_uuid),
            ServerEvent.DEVICE_LIST,
            devices=self._manager.get_devices(),
        )

    def send_devices_to_channel(self, channel_layer, channel_name: str) -> None:
        atos(channel_layer.send)(
            channel_name,
            {
                "type": "ws_event",
                "event": ServerEvent.DEVICE_LIST,
                "payload": {"devices": self._manager.get_devices()},
            },
        )
