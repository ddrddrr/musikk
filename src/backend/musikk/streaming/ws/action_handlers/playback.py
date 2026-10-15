from collections.abc import Callable

from websockets.action_handler import WSActionHandler

from streaming.audio.config import MAX_DURATION_SECONDS
from streaming.managers.device_manager import DeviceManager
from streaming.models.stored_playback_state import locked_stored_playback_state
from streaming.ws.state_broadcasters.device import DeviceStateBroadcaster
from streaming.ws.state_broadcasters.playback import PlaybackStateBroadcaster


class PlaybackWSActionHandler(WSActionHandler):
    """Handles playback-related ws actions.

    Only the active device, the one tab that plays the audio, knows the real play
    state and position. So between track changes it is the only one that writes
    them. It sends a report each time its audio plays, pauses or seeks,
    and in heartbeat intervals.
    The server stores the report and sends it to all tabs as a snapshot.

    A tab that wants to play, pause or seek sends a set command. The server does
    not store the command. It forwards it to the active device, which applies it
    to its audio and then reports the result.

    The stored position is a pair of `last_known_song_pos_ms` and
    `last_known_song_pos_updated_at_server_ms`, because a plain position would
    already be old when a tab reads it. A reader adds the server time passed since
    `last_known_song_pos_updated_at_server_ms` to get the current position. Each
    snapshot carries the server time, so tabs can estimate the server clock.
    """

    def __init__(self, consumer):
        super().__init__(consumer)
        self.device_manager = DeviceManager(user_uuid=consumer.user_uuid)
        self.device_broadcaster = DeviceStateBroadcaster(user_uuid=consumer.user_uuid)
        self.playback_state_broadcaster = PlaybackStateBroadcaster(
            user_uuid=consumer.user_uuid
        )

    def get_actions(self) -> dict[str, Callable]:
        return {
            "playback.set": self.handle_set,
            "playback.active-device-report": self.handle_active_device_report,
        }

    def handle_set(self, payload: dict):
        command = self._parse_set_command(payload)
        if not command:
            return
        with locked_stored_playback_state(
            self.consumer.user_uuid
        ) as stored_playback_state:
            if not stored_playback_state.has_curr_play_item():
                return
            # a tab that has not seen the latest track change may seek in the old song
            if "song_pos_ms" in command and command["curr_play_item_unique_id"] != str(
                stored_playback_state.curr_play_item_unique_id
            ):
                return

            channel_name = self._resolve_active_device_channel()
            if channel_name is None:
                return
            self.playback_state_broadcaster.send_set_command_to_channel(
                self.consumer.channel_layer, channel_name, command
            )

    def handle_active_device_report(self, payload: dict):
        device_id = self.consumer.device_id
        if not device_id or device_id != self.device_manager.get_active_device_id():
            return

        curr_play_item_unique_id = self._parse_curr_play_item_unique_id(payload)
        is_playing = self._parse_is_playing(payload)
        song_pos_ms = self._parse_song_pos_ms(payload)
        if (
            curr_play_item_unique_id is None
            or is_playing is None
            or song_pos_ms is None
        ):
            return

        with locked_stored_playback_state(
            self.consumer.user_uuid
        ) as stored_playback_state:
            if stored_playback_state.apply_play_report(
                curr_play_item_unique_id, is_playing, song_pos_ms
            ):
                self.playback_state_broadcaster.broadcast_snapshot(
                    stored_playback_state
                )

    def _resolve_active_device_channel(self) -> str | None:
        """Returns the channel name of the active device (which should apply a change).

        If no device plays the audio, the sender becomes the active device.
        """
        channel_name = self.device_manager.get_active_device_channel()
        if channel_name is not None:
            return channel_name

        device_id = self.consumer.device_id
        if not device_id:
            return None
        self.device_manager.set_active_device(device_id)
        self.device_broadcaster.broadcast_devices()
        return self.consumer.channel_name

    @classmethod
    def _parse_set_command(cls, payload: dict) -> dict:
        """Rebuilds the `set` command with valid values.

        An aux device can send a malformed/invalid `set` command, hence we
        revalidate and rebuild, so it can be properly applied on the active device.
        """
        command = {}
        is_playing = cls._parse_is_playing(payload)
        if is_playing is not None:
            command["is_playing"] = is_playing

        song_pos_ms = cls._parse_song_pos_ms(payload)
        curr_play_item_unique_id = cls._parse_curr_play_item_unique_id(payload)
        if song_pos_ms is not None and curr_play_item_unique_id is not None:
            command["song_pos_ms"] = song_pos_ms
            command["curr_play_item_unique_id"] = curr_play_item_unique_id
        return command

    @staticmethod
    def _parse_is_playing(payload: dict) -> bool | None:
        value = payload.get("is_playing")
        return value if isinstance(value, bool) else None

    @staticmethod
    def _parse_curr_play_item_unique_id(payload: dict) -> str | None:
        value = payload.get("curr_play_item_unique_id")
        return value if isinstance(value, str) else None

    @staticmethod
    def _parse_song_pos_ms(payload: dict) -> int | None:
        value = payload.get("song_pos_ms")
        if not isinstance(value, (int, float)):
            return None
        # a client can send any number, even Infinity, but no real position
        # is past the end of the longest song that can be uploaded
        if not 0 <= value <= MAX_DURATION_SECONDS * 1000:
            return None
        return int(value)
