from redis_helpers import get_default_redis_conn


# TODO: celery task to remove inactive states?
class PlaybackManager:
    def __init__(self, user_uuid: str):
        self.playback_key = f"user:{user_uuid}:playback"

    def activate(self):
        r = get_default_redis_conn()
        r.set(self.playback_key, True)

    def stop(self):
        r = get_default_redis_conn()
        r.set(self.playback_key, False)

    def get_state(self) -> bool:
        r = get_default_redis_conn()
        return r.get(self.playback_key)
