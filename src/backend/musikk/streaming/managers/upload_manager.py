from redis_helpers import get_default_redis_conn
from utils.data import try_decode

STATUS_TTL = 60 * 60 * 2  # 2 hours


class UploadManager:
    def __init__(self, song_uuid: str):
        self._song_upload_key = f"song_upload:{song_uuid}"

    def set_status(self, status: str):
        r = get_default_redis_conn()
        r.set(self._song_upload_key, status, ex=STATUS_TTL)

    def get_status(self) -> str:
        r = get_default_redis_conn()
        return try_decode(r.get(self._song_upload_key))
