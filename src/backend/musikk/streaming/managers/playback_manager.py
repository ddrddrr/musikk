import json
import time
from dataclasses import asdict, dataclass

from redis_helpers import get_default_redis_conn


def now_server_ms() -> int:
    return int(time.time() * 1000)


@dataclass(frozen=True)
class PlaybackState:
    """Curr user playback state (position, active state, etc.)

    The position is stored as a pair of values -
    `last_known_song_pos_ms` taken at `last_known_at_server_ms`

    Fields:
        - current_song_uuid: currently playing collection song
        - is_playing: whether the playback is active (i.e., the time position is moving forward)
        - last_known_song_pos_ms: position within the song when the state was last updated
        - last_known_at_server_ms: position on the server when the state was last updated
        - version: value that is incremented on "real" state updates.
            Used by client to discard stale playback state broadcasts (helps with races).
    """

    current_song_uuid: str | None
    is_playing: bool
    last_known_song_pos_ms: int
    last_known_at_server_ms: int
    version: int

    def calculate_song_pos_ms(self) -> int:
        """Estimate the curr position in the song

        If playing, that's the stored position plus the time passed since it was stored
        If paused, just the stored position
        """
        if self.is_playing:
            return self.last_known_song_pos_ms + (
                now_server_ms() - self.last_known_at_server_ms
            )
        return self.last_known_song_pos_ms

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "PlaybackState":
        return cls(
            current_song_uuid=data.get("current_song_uuid"),
            is_playing=bool(data.get("is_playing", False)),
            last_known_song_pos_ms=int(data.get("last_known_song_pos_ms") or 0),
            last_known_at_server_ms=int(data.get("last_known_at_server_ms") or 0),
            version=int(data.get("version") or 0),
        )

    @classmethod
    def empty(cls) -> "PlaybackState":
        return cls(
            current_song_uuid=None,
            is_playing=False,
            last_known_song_pos_ms=0,
            last_known_at_server_ms=0,
            version=0,
        )


class PlaybackManager:
    SEEK_VERSION_BUMP_THRESHOLD_MS = 10

    def __init__(self, user_uuid: str):
        self._playback_state_key = f"user:{user_uuid}:playback_state"

    def is_playing(self) -> bool:
        return (self.get_playback_state() or PlaybackState.empty()).is_playing

    # TODO: make this return the empty playback state (requires fe changes)
    def get_playback_state(self) -> PlaybackState | None:
        r = get_default_redis_conn()
        raw = r.get(self._playback_state_key)
        if not raw:
            return None
        try:
            return PlaybackState.from_dict(json.loads(raw))
        except (ValueError, TypeError):
            return None

    def set_playback_state(self, playback_state: PlaybackState) -> None:
        r = get_default_redis_conn()
        r.set(self._playback_state_key, json.dumps(playback_state.to_dict()))

    def clear_playback_state(self) -> None:
        r = get_default_redis_conn()
        r.delete(self._playback_state_key)

    def transition_start_playing(
        self, song_uuid: str | None, song_pos_ms: int
    ) -> PlaybackState:
        """Writes "playing this song at this pos" info into playback state"""
        prev = self.get_playback_state() or PlaybackState.empty()
        playback_state = PlaybackState(
            current_song_uuid=song_uuid,
            is_playing=True,
            last_known_song_pos_ms=song_pos_ms,
            last_known_at_server_ms=now_server_ms(),
            version=self._next_version(
                prev,
                bump=(not prev.is_playing or prev.current_song_uuid != song_uuid),
            ),
        )
        self.set_playback_state(playback_state)
        return playback_state

    def transition_pause(self) -> PlaybackState:
        prev = self.get_playback_state() or PlaybackState.empty()
        playback_state = PlaybackState(
            current_song_uuid=prev.current_song_uuid,
            is_playing=False,
            last_known_song_pos_ms=prev.calculate_song_pos_ms(),
            last_known_at_server_ms=now_server_ms(),
            version=self._next_version(prev, bump=prev.is_playing),
        )
        self.set_playback_state(playback_state)
        return playback_state

    def transition_seek(self, song_pos_ms: int) -> PlaybackState:
        """Moves the playback position within the current song

        `moved` is True only if the new position differs from the stored
        one by more than `SEEK_VERSION_BUMP_THRESHOLD_MS`
        (i.e. it was a real seek, not small drift, since client and server clocks are different)
        """
        prev = self.get_playback_state() or PlaybackState.empty()
        moved = (
            abs(song_pos_ms - prev.last_known_song_pos_ms)
            > self.SEEK_VERSION_BUMP_THRESHOLD_MS
        )
        playback_state = PlaybackState(
            current_song_uuid=prev.current_song_uuid,
            is_playing=prev.is_playing,
            last_known_song_pos_ms=song_pos_ms,
            last_known_at_server_ms=now_server_ms(),
            version=self._next_version(prev, bump=moved),
        )
        self.set_playback_state(playback_state)
        return playback_state

    def transition_change_song(self, song_uuid: str) -> PlaybackState:
        """Switches to a new song at position 0"""
        prev = self.get_playback_state() or PlaybackState.empty()
        playback_state = PlaybackState(
            current_song_uuid=song_uuid,
            is_playing=prev.is_playing,
            last_known_song_pos_ms=0,
            last_known_at_server_ms=now_server_ms(),
            version=prev.version + 1,
        )
        self.set_playback_state(playback_state)
        return playback_state

    def transition_sync(self, song_pos_ms: int) -> PlaybackState:
        """
        We don't bump `version`, since sync isn't a new playback state per-se.
        If we bumped, a sync racing with a "real" user action (seek, stop) could end up winning
        the version comparison and real action would be discarded
        """
        prev = self.get_playback_state() or PlaybackState.empty()
        playback_state = PlaybackState(
            current_song_uuid=prev.current_song_uuid,
            is_playing=prev.is_playing,
            last_known_song_pos_ms=int(song_pos_ms),
            last_known_at_server_ms=now_server_ms(),
            version=prev.version,
        )
        self.set_playback_state(playback_state)
        return playback_state

    @staticmethod
    def _next_version(prev: PlaybackState, *, bump: bool) -> int:
        return prev.version + 1 if bump else prev.version
