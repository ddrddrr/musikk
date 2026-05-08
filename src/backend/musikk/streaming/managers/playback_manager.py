import json
import time
import uuid
from dataclasses import asdict, dataclass

from redis_helpers import get_default_redis_conn


def now_server_ms() -> int:
    return int(time.time() * 1000)


@dataclass(frozen=True)
class ActivePlayback:
    """Audio-bearing portion of `PlaybackState`.

    Position is stored as a pair of `last_known_song_pos_ms` and
    `last_known_at_server_ms` so its possible then to estimate the current
    time position by adding the elapsed server time

    `play_instance_uuid` is a unique id of each play element
    (helps with the same collection song appearing multiple times in a row)
    """

    current_song_uuid: str
    play_instance_uuid: str
    is_playing: bool
    last_known_song_pos_ms: int
    last_known_at_server_ms: int

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


@dataclass(frozen=True)
class PlaybackState:
    """Current user playback state

    Attrs:
        - `active`: playback info, None if no song is loaded (hence no playback time/current song)
        - `version`: is an action counter, we increment it on seek, song change, etc.
        (helps distinguish stale events on fe)
    """

    active: ActivePlayback | None
    version: int

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "PlaybackState":
        active_data = data.get("active")
        active = ActivePlayback(**active_data) if active_data else None
        return cls(active=active, version=int(data["version"]))

    @classmethod
    def empty(cls) -> "PlaybackState":
        return cls(active=None, version=0)


class PlaybackManager:
    SEEK_VERSION_BUMP_THRESHOLD_MS = 10

    def __init__(self, user_uuid: str):
        self._playback_state_key = f"user:{user_uuid}:playback_state"

    def is_playing(self) -> bool:
        state = self.get_playback_state()
        return (
            state is not None and state.active is not None and state.active.is_playing
        )

    # TODO: make this return the empty playback state (requires fe changes)
    def get_playback_state(self) -> PlaybackState | None:
        r = get_default_redis_conn()
        raw = r.get(self._playback_state_key)
        if not raw:
            return None
        try:
            return PlaybackState.from_dict(json.loads(raw))
        except (ValueError, TypeError, KeyError):
            return None

    def set_playback_state(self, playback_state: PlaybackState) -> None:
        r = get_default_redis_conn()
        r.set(self._playback_state_key, json.dumps(playback_state.to_dict()))

    def clear_playback_state(self) -> None:
        r = get_default_redis_conn()
        r.delete(self._playback_state_key)

    def transition_start_playing(
        self, song_uuid: str, song_pos_ms: int
    ) -> PlaybackState:
        """Writes "playing this song at this pos" info into playback state"""
        prev = self.get_playback_state() or PlaybackState.empty()
        prev_active = prev.active
        song_changed = prev_active is None or prev_active.current_song_uuid != song_uuid
        play_instance_uuid = (
            str(uuid.uuid4())
            if song_changed or prev_active is None
            else prev_active.play_instance_uuid
        )
        new_active = ActivePlayback(
            current_song_uuid=song_uuid,
            play_instance_uuid=play_instance_uuid,
            is_playing=True,
            last_known_song_pos_ms=song_pos_ms,
            last_known_at_server_ms=now_server_ms(),
        )
        was_playing = prev_active is not None and prev_active.is_playing
        new_state = PlaybackState(
            active=new_active,
            version=self._next_version(prev, bump=(not was_playing or song_changed)),
        )
        self.set_playback_state(new_state)
        return new_state

    def transition_pause(self) -> PlaybackState:
        prev = self.get_playback_state() or PlaybackState.empty()
        if prev.active is None:
            return prev
        new_active = ActivePlayback(
            current_song_uuid=prev.active.current_song_uuid,
            play_instance_uuid=prev.active.play_instance_uuid,
            is_playing=False,
            last_known_song_pos_ms=prev.active.calculate_song_pos_ms(),
            last_known_at_server_ms=now_server_ms(),
        )
        new_state = PlaybackState(
            active=new_active,
            version=self._next_version(prev, bump=prev.active.is_playing),
        )
        self.set_playback_state(new_state)
        return new_state

    def transition_seek(self, song_pos_ms: int) -> PlaybackState:
        """Moves the playback position within the current song

        `moved` is True only if the new position differs from the stored
        one by more than `SEEK_VERSION_BUMP_THRESHOLD_MS`
        (i.e. it was a real seek, not small drift, since client and server clocks are different)
        """
        prev = self.get_playback_state() or PlaybackState.empty()
        if prev.active is None:
            return prev
        moved = (
            abs(song_pos_ms - prev.active.last_known_song_pos_ms)
            > self.SEEK_VERSION_BUMP_THRESHOLD_MS
        )
        new_active = ActivePlayback(
            current_song_uuid=prev.active.current_song_uuid,
            play_instance_uuid=prev.active.play_instance_uuid,
            is_playing=prev.active.is_playing,
            last_known_song_pos_ms=song_pos_ms,
            last_known_at_server_ms=now_server_ms(),
        )
        new_state = PlaybackState(
            active=new_active,
            version=self._next_version(prev, bump=moved),
        )
        self.set_playback_state(new_state)
        return new_state

    def transition_change_song(self, song_uuid: str) -> PlaybackState:
        """Switches to a new song at position 0"""
        prev = self.get_playback_state() or PlaybackState.empty()
        prev_was_playing = prev.active is not None and prev.active.is_playing
        new_active = ActivePlayback(
            current_song_uuid=song_uuid,
            play_instance_uuid=str(uuid.uuid4()),
            is_playing=prev_was_playing,
            last_known_song_pos_ms=0,
            last_known_at_server_ms=now_server_ms(),
        )
        new_state = PlaybackState(active=new_active, version=prev.version + 1)
        self.set_playback_state(new_state)
        return new_state

    def transition_sync(self, song_pos_ms: int) -> PlaybackState:
        """
        We don't bump `version`, since sync isn't a new playback state per-se.
        If we bumped, a sync racing with a "real" user action (seek, stop) could end up winning
        the version comparison and real action would be discarded
        """
        prev = self.get_playback_state() or PlaybackState.empty()
        if prev.active is None:
            return prev
        new_active = ActivePlayback(
            current_song_uuid=prev.active.current_song_uuid,
            play_instance_uuid=prev.active.play_instance_uuid,
            is_playing=prev.active.is_playing,
            last_known_song_pos_ms=int(song_pos_ms),
            last_known_at_server_ms=now_server_ms(),
        )
        new_state = PlaybackState(active=new_active, version=prev.version)
        self.set_playback_state(new_state)
        return new_state

    @staticmethod
    def _next_version(prev: PlaybackState, *, bump: bool) -> int:
        return prev.version + 1 if bump else prev.version
