import json
import uuid

from redis_helpers import get_default_redis

DEVICE_TTL_SECONDS = 3  # heartbeat TTL seconds


class DeviceManager:
    def __init__(self, user_uuid: str, device_id: str):
        self.user_uuid = str(user_uuid)
        self.device_id = device_id
        self.devices_set_key = f"user:{self.user_uuid}:devices"
        self.device_key = f"user:{self.user_uuid}:device:{device_id}"
        self.active_device_key = f"user:{self.user_uuid}:active_device"

    @staticmethod
    def _decode(value):
        return value.decode() if isinstance(value, bytes) else value

    def register_or_touch_device(self, device_id: str | None, name: str | None) -> str:
        """
        Create/update device entry with TTL and return device_id.
        """
        r = get_default_redis()

        if not device_id:
            device_id = str(uuid.uuid4())

        existing_raw = r.get(self.device_key)
        data = {}
        if existing_raw:
            try:
                data = json.loads(existing_raw)
            except Exception:
                data = {}

        if name is not None:
            data["name"] = name

        r.set(self.device_key, json.dumps(data), ex=DEVICE_TTL_SECONDS)
        r.sadd(self.devices_set_key, device_id)

        return device_id

    def heartbeat(self, device_id: str):
        """
        Refresh TTL for a device (no name change).
        """
        if not device_id:
            return

        r = get_default_redis()

        existing_raw = r.get(self.device_key)
        data = {}
        if existing_raw:
            try:
                data = json.loads(existing_raw)
            except Exception:
                # TODO: what to do in that case?
                data = {}

        r.set(self.device_key, json.dumps(data), ex=DEVICE_TTL_SECONDS)
        r.sadd(self.devices_set_key, device_id)

    def get_devices(self):
        """
        Returns list of devices for user with is_active flag.
        Cleans up stale set entries.
        """
        r = get_default_redis()

        active_device_id = r.get(self.active_device_key)
        active_device_id = self._decode(active_device_id) if active_device_id else None

        device_ids = r.smembers(self.devices_set_key)
        devices = []
        for did_raw in device_ids:
            device_id = self._decode(did_raw)
            raw = r.get(self.device_key)
            if not raw:
                r.srem(self.devices_set_key, device_id)
                continue

            try:
                data = json.loads(raw)
            except Exception:
                data = {}

            devices.append(
                {
                    "id": device_id,
                    "name": data.get("name", "Unknown device"),
                    "is_active": device_id == active_device_id,
                }
            )

        return devices

    def set_active_device(self, device_id: str) -> tuple[str | None, str | None]:
        """
        Set active device and return (prev_active, new_active).
        """
        if not device_id:
            return None, None

        r = get_default_redis()

        prev_active = r.get(self.active_device_key)
        prev_active = self._decode(prev_active) if prev_active else None

        r.set(self.active_device_key, device_id, ex=DEVICE_TTL_SECONDS)

        return prev_active, device_id

    def clear_device(self, device_id: str) -> str | None:
        """
        Remove a device from redis.
        Returns prev_active if the removed device was active.
        """
        if not device_id:
            return None

        r = get_default_redis()

        r.delete(self.device_key)
        r.srem(self.devices_set_key, device_id)

        prev_active = r.get(self.active_device_key)
        prev_active = self._decode(prev_active) if prev_active else None

        if prev_active == device_id:
            r.delete(self.active_device_key)
            return prev_active

        return None
