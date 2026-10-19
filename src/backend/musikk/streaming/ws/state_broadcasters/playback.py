from django.contrib.auth import get_user_model
from utils.clock import now_server_ms
from websockets.event_helpers import (
    send_ws_event,
    send_ws_event_to_channel,
    user_group,
)

from streaming.api.v1.serializers.songs import CollectionSongRetrieveSerializer
from streaming.managers.device_manager import DeviceManager
from streaming.models import StoredPlaybackState
from streaming.ws.events import ServerEvent

User = get_user_model()


class PlaybackStateBroadcaster:
    def __init__(self, user_uuid: str):
        self.user_uuid = user_uuid
        self._user = User.objects.filter(uuid=user_uuid).first()
        self._device_manager = DeviceManager(user_uuid=user_uuid)

    def broadcast_snapshot(self, stored_playback_state: StoredPlaybackState) -> None:
        """Sends the play state of `stored_playback_state` to all tabs of the user."""
        send_ws_event(
            user_group(self.user_uuid),
            ServerEvent.PLAYBACK_SNAPSHOT,
            **self._build_snapshot(stored_playback_state),
        )

    def broadcast_queue_changed(self) -> None:
        send_ws_event(user_group(self.user_uuid), ServerEvent.QUEUE_CHANGED)

    def send_snapshot_to_channel(
        self,
        channel_layer,
        channel_name: str,
        stored_playback_state: StoredPlaybackState,
    ) -> None:
        # used on device.register so the joining connection gets initial state
        send_ws_event_to_channel(
            channel_layer,
            channel_name,
            ServerEvent.PLAYBACK_SNAPSHOT,
            **self._build_snapshot(stored_playback_state),
        )

    def send_set_command_to_channel(
        self, channel_layer, channel_name: str, payload: dict
    ) -> None:
        send_ws_event_to_channel(
            channel_layer,
            channel_name,
            ServerEvent.PLAYBACK_SET,
            **payload,
        )

    def _build_snapshot(self, stored_playback_state: StoredPlaybackState) -> dict:
        """Builds the play state together with the id of the active device.

        A tab takes its role and the play state from the same message. If they
        came in two messages, the tab would depend on the order in which they arrive.
        """
        return {
            "current_song": self._serialize_current_song(stored_playback_state),
            "server_ts_ms": now_server_ms(),
            "playback_state": self._serialize_playback_state(stored_playback_state),
            "active_device_id": self._device_manager.get_active_device_id(),
        }

    @staticmethod
    def _serialize_playback_state(
        stored_playback_state: StoredPlaybackState,
    ) -> dict | None:
        if not stored_playback_state.has_curr_play_item():
            return None
        return {
            "current_song_uuid": str(stored_playback_state.current_collection_song_id),
            "curr_play_item_unique_id": str(
                stored_playback_state.curr_play_item_unique_id
            ),
            "is_playing": stored_playback_state.is_playing(),
            "last_known_song_pos_ms": stored_playback_state.last_known_song_pos_ms,
            "last_known_song_pos_updated_at_server_ms": (
                stored_playback_state.last_known_song_pos_updated_at_server_ms
            ),
        }

    # not the best that we have to serialize in here, but currently no easy workaround
    def _serialize_current_song(
        self, stored_playback_state: StoredPlaybackState
    ) -> dict | None:
        current = stored_playback_state.current_collection_song
        if not current:
            return None
        return CollectionSongRetrieveSerializer(
            current, context={"user": self._user}
        ).data
