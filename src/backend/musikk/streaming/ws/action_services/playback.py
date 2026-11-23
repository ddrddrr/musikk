from websockets.action_service import WSAction, WSActionService

from streaming.managers.device_manager import DeviceManager
from streaming.models.stored_playback_state import (
    StoredPlaybackState,
    locked_stored_playback_state,
)
from streaming.ws.serializers import ActiveDeviceReportSerializer, PlaybackSetSerializer
from streaming.ws.state_broadcasters.device import DeviceStateBroadcaster
from streaming.ws.state_broadcasters.playback import PlaybackStateBroadcaster


class PlaybackWSActionService(WSActionService):
    """
    Handles playback-related ws actions.

    Only the active device (the tab that plays the audio) knows the real play state and position,
    so between track changes it's the only one writing them. It reports on play, pause, seek and
    on a heartbeat, and the server sends each report to all tabs as a snapshot.

    Other tabs send set commands, which the server just forwards to the active device. If no
    device is active, the sender becomes active and the server stores the command itself.
    """

    def __init__(self, consumer):
        super().__init__(consumer)
        self.device_manager = DeviceManager(user_uuid=consumer.user_uuid)
        self.device_broadcaster = DeviceStateBroadcaster(user_uuid=consumer.user_uuid)
        self.playback_state_broadcaster = PlaybackStateBroadcaster(
            user_uuid=consumer.user_uuid
        )

    def get_actions(self) -> dict[str, WSAction]:
        return {
            "playback.set": {
                "handler": self.handle_set,
                "serializer": PlaybackSetSerializer,
                "on_invalid": "drop",
            },
            "playback.active-device-report": {
                "handler": self.handle_active_device_report,
                "serializer": ActiveDeviceReportSerializer,
                "on_invalid": "drop",
            },
        }

    def handle_set(self, payload: dict):
        with locked_stored_playback_state(
            self.consumer.user_uuid
        ) as stored_playback_state:
            if not stored_playback_state.has_curr_play_item():
                return
            # a tab that has not seen the latest track change may seek in the old song
            if "song_pos_ms" in payload and payload["curr_play_item_unique_id"] != str(
                stored_playback_state.curr_play_item_unique_id
            ):
                return

            channel_name = self.device_manager.get_active_device_channel()
            if channel_name is None:
                self._activate_sender_with_command(stored_playback_state, payload)
                return
            self.playback_state_broadcaster.send_set_command_to_channel(
                self.consumer.channel_layer, channel_name, payload
            )

    def handle_active_device_report(self, payload: dict):
        device_id = self.consumer.device_id
        if not device_id:
            return

        with locked_stored_playback_state(
            self.consumer.user_uuid
        ) as stored_playback_state:
            # read under the row lock, so a report that the old device sent during
            # a device switch is dropped and not stored after the pause
            if device_id != self.device_manager.get_active_device_id():
                return
            if stored_playback_state.apply_play_report(
                payload["curr_play_item_unique_id"],
                payload["is_playing"],
                payload["song_pos_ms"],
            ):
                self.playback_state_broadcaster.broadcast_snapshot(
                    stored_playback_state
                )

    def _activate_sender_with_command(
        self, stored_playback_state: StoredPlaybackState, payload: dict
    ) -> None:
        device_id = self.consumer.device_id
        if not device_id:
            return
        self.device_manager.set_active_device(device_id)
        stored_playback_state.apply_set_command(
            is_playing=payload.get("is_playing"),
            song_pos_ms=payload.get("song_pos_ms"),
        )
        self.playback_state_broadcaster.broadcast_snapshot(stored_playback_state)
        self.device_broadcaster.broadcast_devices()
