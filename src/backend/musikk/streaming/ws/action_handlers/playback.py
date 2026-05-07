from collections.abc import Callable

from websockets.action_handler import WSActionHandler

from streaming.managers.device_manager import DeviceManager
from streaming.managers.playback_manager import PlaybackManager, PlaybackState
from streaming.ws.playback_controller import PlaybackController
from streaming.ws.state_broadcasters.device import DeviceStateBroadcaster


class PlaybackWSActionHandler(WSActionHandler):
    """Handles playback-related ws actions.

    There are three types of places we need to sync:
    - Active client: the one tab producing audio (1/user).
      Its `audio.currentTime` is the actual value of the audio time position.
    - Passive clients: other tabs that just render curr audio time which the server sends (no audio element).
    - Server: holds shared `PlaybackState` per user.

    `PlaybackState` doesn't store only the song timestamp ("the song is at 2000 ms"), since
    it would be already stale when one of the passive clients picks it up, so the state
    holds two values:
    - `last_known_song_pos_ms` - the song was at x ms inside the track
    - `last_known_at_server_ms` - at server time t
    Any reader caculates the current position by taking the elapsed server
    time since t (i.e. `curr server time - t`) and adding it to x
    (that gives the song time the active client should be at right now).
    Clients don't have `curr server time` directly, so each ws playback broadcast
    carries a server timestamp which clients use to sync their clocks.

    Passive clients assume audio advances 1ms per 1ms of the clock, but
    the active player's `audio.currentTime` can drift away from that, e.g.,
    the browser lags for a brief moment or the tab gets put to background/woken up.
    After a few minutes those small gaps pile up and passive tabs' progress bars could run visibly ahead/behind of
    where the song actually is.
    So the active client periodically reports its real `audio.currentTime` via `sync`, and the server
    overwrites the stored pair with fresh values.
    """

    def __init__(self, consumer):
        super().__init__(consumer)
        self.manager = PlaybackManager(user_uuid=consumer.user_uuid)
        self.playback_controller = PlaybackController(user_uuid=consumer.user_uuid)
        self.device_broadcaster = DeviceStateBroadcaster(user_uuid=consumer.user_uuid)

    def get_actions(self) -> dict[str, Callable]:
        return {
            "playback.activate": self.handle_activate,
            "playback.stop": self.handle_stop,
            "playback.seek": self.handle_seek,
            "playback.sync": self.handle_sync_server_to_active,
        }

    def handle_activate(self, payload: dict):
        self.playback_controller.activate(self._current_song_uuid())

    def handle_stop(self, payload: dict):
        self.playback_controller.stop()

    def handle_seek(self, payload: dict):
        song_pos_ms = self._parse_song_pos_ms(payload)
        if song_pos_ms is None:
            return
        if self._state_synced_with_fe(payload) is None:
            return

        self._auto_activate_if_no_active_device()

        self.playback_controller.seek(song_pos_ms)

    def handle_sync_server_to_active(self, payload: dict):
        song_pos_ms = self._parse_song_pos_ms(payload)
        if song_pos_ms is None:
            return
        prev_state = self._state_synced_with_fe(payload)
        if prev_state is None:
            return

        self.playback_controller.sync(song_pos_ms, prev_state)

    def _state_synced_with_fe(self, payload: dict) -> PlaybackState | None:
        """Returns the stored state iff the FE-reported uuid matches the stored one.

        Multiple consumers per user (multi-tab/multi-browser) race on the same
        per-user playback state. If a tab acts on a song the user has since
        moved past, drop the action — the next snapshot will resync that tab.
        """
        state = self.manager.get_playback_state()
        if not state or state.current_song_uuid is None:
            return None
        if payload.get("current_song_uuid") != state.current_song_uuid:
            return None
        return state

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

    def _current_song_uuid(self) -> str | None:
        user = self.consumer.user
        if user is None:
            return None
        player = user.streamingprofile.player
        player.refresh_from_db(fields=["current_collection_song"])
        current = player.current_collection_song
        return str(current.uuid) if current else None

    @staticmethod
    def _parse_song_pos_ms(payload: dict) -> int | None:
        value = payload.get("song_pos_ms")
        if not isinstance(value, (int, float)) or value < 0:
            return None
        return int(value)
