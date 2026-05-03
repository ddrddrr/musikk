import json

from redis_helpers import get_default_redis_conn
from utils.data import try_decode


class PlaybackManager:
    def __init__(self, user_uuid: str):
        self._playback_key = f"user:{user_uuid}:playback"
        self._position_key = f"user:{user_uuid}:position"

    def activate(self):
        r = get_default_redis_conn()
        r.set(self._playback_key, "true")

    def stop(self):
        r = get_default_redis_conn()
        r.set(self._playback_key, "false")

    def is_playback_active(self) -> bool:
        r = get_default_redis_conn()

        return try_decode(r.get(self._playback_key)) == "true"

    def set_position(self, position: float, collection_song_uuid: str | None) -> None:
        r = get_default_redis_conn()
        r.set(
            self._position_key,
            json.dumps(
                {
                    "position": float(position),
                    "collection_song_uuid": collection_song_uuid,
                }
            ),
        )

    def clear_position(self) -> None:
        r = get_default_redis_conn()
        r.delete(self._position_key)

    def get_position(self) -> dict | None:
        r = get_default_redis_conn()

        raw = r.get(self._position_key)
        if not raw:
            return None
        try:
            return json.loads(raw)
        except (ValueError, TypeError):
            return None
