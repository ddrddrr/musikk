from streaming.managers.playback_manager import (
    ActivePlayback,
    PlaybackManager,
    PlaybackState,
)
from streaming.ws.state_broadcasters.player import PlayerStateBroadcaster


class PlaybackController:
    """
    On a sync we compare the fresh `audio.currentTime` against what our stored
    pair would have predicted. Small gap means passive tabs were showing roughly
    the right second, so we silently overwrite and move on. Large gap means
    they've been visibly off, so we broadcast a seek to snap them.

    500ms is roughly where users start noticing the seekbar trail the audio.
    Below that, broadcasting isn't worth it - every passive tab re-renders and
    its seekbar twitches as it snaps, which for a gap nobody sees is pure jitter.

    Matches `SYNC_DRIFT_THRESHOLD_MS` on the FE in `usePlayer.ts`. The active
    tab only sends a sync when local drift goes over 500ms, or every 20s as
    a heartbeat. So drift-triggered syncs land above this and broadcast,
    heartbeats land below and absorb silently.
    """

    # TODO: this probably should be negotiated betwee be and fe via an endpoint
    SYNC_DRIFT_BROADCAST_THRESHOLD_MS = 500

    def __init__(self, user_uuid: str):
        self.user_uuid = user_uuid
        self._manager = PlaybackManager(user_uuid=user_uuid)
        self._broadcaster = PlayerStateBroadcaster(user_uuid=user_uuid)

    def stop(self) -> None:
        self._manager.transition_pause()
        self._broadcaster.broadcast_snapshot()

    def activate(self, current_song_uuid: str | None) -> None:
        if current_song_uuid is None:
            return

        prev_state = self._manager.get_playback_state() or PlaybackState.empty()
        prev_active = prev_state.active
        if (
            prev_active is not None
            and prev_active.current_song_uuid == current_song_uuid
        ):
            estimated_song_pos_ms = prev_active.calculate_song_pos_ms()
        else:
            estimated_song_pos_ms = 0
        self._manager.transition_start_playing(current_song_uuid, estimated_song_pos_ms)
        self._broadcaster.broadcast_snapshot()

    def seek(self, song_pos_ms: int) -> None:
        self._manager.transition_seek(song_pos_ms)
        self._broadcaster.broadcast_seek()

    def sync(self, song_pos_ms: int, prev_active: ActivePlayback) -> None:
        """Active device sends its real `audio.currentTime`, and we overwrite the stored
        `last_known_song_pos_ms` / `last_known_at_server_ms` pair with that fresh value
        """
        self._manager.transition_sync(song_pos_ms)
        if (
            abs(song_pos_ms - prev_active.calculate_song_pos_ms())
            > self.SYNC_DRIFT_BROADCAST_THRESHOLD_MS
        ):
            self._broadcaster.broadcast_snapshot()
