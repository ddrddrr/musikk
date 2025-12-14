from redis_helpers import get_default_redis_conn
from utils.data import try_decode


# TODO: celery task to remove inactive states?
class PlaybackManager:
    def __init__(self, user_uuid: str):
        self.playback_key = f"user:{user_uuid}:playback"

    def activate(self):
        r = get_default_redis_conn()
        r.set(self.playback_key, "true")

    def stop(self):
        r = get_default_redis_conn()
        r.set(self.playback_key, "false")

    def is_playback_active(self) -> bool:
        r = get_default_redis_conn()

        return try_decode(r.get(self.playback_key)) == "true"
