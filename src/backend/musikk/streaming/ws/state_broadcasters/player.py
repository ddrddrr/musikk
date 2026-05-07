from asgiref.sync import async_to_sync as atos
from django.contrib.auth import get_user_model
from websockets.event_helpers import send_ws_event, user_group

from streaming.api.v1.serializers.songs import CollectionSongRetrieveSerializer
from streaming.managers.playback_manager import PlaybackManager, now_server_ms
from streaming.ws.events import ServerEvent

User = get_user_model()


class PlayerStateBroadcaster:
    def __init__(self, user_uuid: str):
        self.user_uuid = user_uuid
        self._user = User.objects.filter(uuid=user_uuid).first()
        self._playback_manager = PlaybackManager(user_uuid=user_uuid)

    def broadcast_snapshot(self) -> None:
        send_ws_event(
            user_group(self.user_uuid),
            ServerEvent.PLAYBACK_SNAPSHOT,
            **self._build_snapshot(),
        )

    def broadcast_seek(self) -> None:
        playback_state = self._playback_manager.get_playback_state()
        send_ws_event(
            user_group(self.user_uuid),
            ServerEvent.PLAYBACK_SEEK,
            server_ts_ms=now_server_ms(),
            playback_state=playback_state.to_dict() if playback_state else None,
        )

    def broadcast_queue_changed(self) -> None:
        send_ws_event(user_group(self.user_uuid), ServerEvent.QUEUE_CHANGED)

    def send_snapshot_to_channel(self, channel_layer, channel_name: str) -> None:
        # used on device.register so the joining connection gets initial state
        atos(channel_layer.send)(
            channel_name,
            {
                "type": "ws_event",
                "event": ServerEvent.PLAYBACK_SNAPSHOT,
                "payload": self._build_snapshot(),
            },
        )

    def _build_snapshot(self) -> dict:
        playback_state = self._playback_manager.get_playback_state()
        return {
            "current_song": self._serialize_current_song(),
            "server_ts_ms": now_server_ms(),
            "playback_state": playback_state.to_dict() if playback_state else None,
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
