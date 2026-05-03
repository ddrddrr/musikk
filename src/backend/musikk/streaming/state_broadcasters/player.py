from asgiref.sync import async_to_sync as atos
from django.contrib.auth import get_user_model
from websockets.event_helpers import send_ws_event, user_group

from streaming.api.v1.serializers.songs import CollectionSongRetrieveSerializer
from streaming.events import ServerEvent
from streaming.managers.playback_manager import PlaybackManager

User = get_user_model()


class PlayerStateBroadcaster:
    """
    Builds/broadcasts the "what's currently playing" info

    The FE used to gather that info from queue HTTP + playback.change WS.
    With independent latencies on those channels,
    transitions could leave the FE briefly inconsistent
    (e.g. play a new song's first ms of the previously-loaded song before switching).
    Broadcasting one snapshot per player mutation makes such transitions
    atomic.
    """

    def __init__(self, user_uuid: str):
        self.user_uuid = user_uuid
        self._user = User.objects.filter(uuid=user_uuid).first()
        self._playback_manager = PlaybackManager(user_uuid=user_uuid)

    def broadcast_state(self, include_position: bool = True) -> None:
        send_ws_event(
            user_group(self.user_uuid),
            ServerEvent.PLAYBACK_SNAPSHOT,
            **self.build_snapshot(include_position=include_position),
        )

    def send_state_to_channel(self, channel_layer, channel_name: str) -> None:
        # used on device.register so the joining connection gets initial state
        atos(channel_layer.send)(
            channel_name,
            {
                "type": "ws_event",
                "event": ServerEvent.PLAYBACK_SNAPSHOT,
                "payload": self.build_snapshot(),
            },
        )

    def build_snapshot(self, include_position: bool = True) -> dict:
        # position omitted on group broadcasts triggered by device.register
        # so already-connected clients don't rewind
        position_snapshot = self._playback_manager.get_position() or {}
        current_song = self._serialize_current_song()
        # the redis flag can outlive the song it referred to, so check, if there is an active song still
        is_playback_active = (
            current_song is not None and self._playback_manager.is_playback_active()
        )
        return {
            "current_song": current_song,
            "is_playback_active": is_playback_active,
            "position": position_snapshot.get("position") if include_position else None,
        }

    # not the best that we have to serialize in here, but currently no easy workaround
    def _serialize_current_song(self) -> dict | None:
        if not self._user:
            return None
        player = self._user.streamingprofile.player
        # without this the relation (which is auto cached...) returns whatever the song was when the WS connection opened,
        # so a snapshot triggered by a WS action (e.g. playback.activate) right after an HTTP play
        # would send the previous song (and never update to any new one)
        player.refresh_from_db(fields=["current_collection_song"])
        current = player.current_collection_song
        if not current:
            return None
        return CollectionSongRetrieveSerializer(
            current, context={"user": self._user}
        ).data
