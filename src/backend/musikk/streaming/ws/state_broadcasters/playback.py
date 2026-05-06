from websockets.event_helpers import send_ws_event, user_group

from streaming.managers.playback_manager import PlaybackManager
from streaming.ws.events import ServerEvent
from streaming.ws.state_broadcasters.player import PlayerStateBroadcaster


class PlaybackStateBroadcaster:
    def __init__(self, user_uuid: str):
        self.user_uuid = user_uuid
        self._manager = PlaybackManager(user_uuid=user_uuid)
        self._player_broadcaster = PlayerStateBroadcaster(user_uuid=user_uuid)

    def stop(self) -> None:
        self._manager.stop()
        self._player_broadcaster.broadcast_state()

    def activate(self) -> None:
        self._manager.activate()
        self._player_broadcaster.broadcast_state()

    def broadcast_seek(
        self,
        position: float,
        collection_song_uuid: str | None,
        exclude_device_id: str | None = None,
    ) -> None:
        self._broadcast_position(
            ServerEvent.PLAYBACK_SEEK,
            position,
            collection_song_uuid,
            exclude_device_id,
        )

    def broadcast_tick(
        self,
        position: float,
        collection_song_uuid: str | None,
        exclude_device_id: str | None = None,
    ) -> None:
        self._broadcast_position(
            ServerEvent.PLAYBACK_TICK,
            position,
            collection_song_uuid,
            exclude_device_id,
        )

    def _broadcast_position(
        self,
        event: str,
        position: float,
        collection_song_uuid: str | None,
        exclude_device_id: str | None,
    ) -> None:
        send_ws_event(
            user_group(self.user_uuid),
            event,
            exclude_device_id=exclude_device_id,
            position=position,
            collection_song_uuid=collection_song_uuid,
        )
