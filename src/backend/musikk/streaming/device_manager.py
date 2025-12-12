import json
from typing import TypedDict

from redis_helpers import get_default_redis_conn

DEVICE_TTL_SECONDS = 5  # heartbeat TTL seconds


def _decode(value):
    return value.decode() if isinstance(value, bytes) else value


class Device(TypedDict):
    id: str
    name: str
    is_active: bool


class DeviceManager:
    def __init__(self, user_uuid: str):
        self._device_key_base = f"user:{user_uuid}"

    def device_key(self, device_id: str) -> str:
        return self._device_key_base + f":device:{device_id}"

    def devices_set_key(self) -> str:
        return self._device_key_base + ":devices"

    def active_device_key(self) -> str:
        return self._device_key_base + ":active_device"

    def register_device(self, device_id: str, name: str | None = None) -> str:
        r = get_default_redis_conn()

        device_data = {"name": name}
        r.set(
            self.device_key(device_id),
            json.dumps(device_data),
            ex=DEVICE_TTL_SECONDS,
        )
        r.sadd(self.devices_set_key(), device_id)
        return device_id

    def touch_device(self, device_id: str) -> str:
        r = get_default_redis_conn()

        device_data = {}
        existing_device_raw = r.get(self.device_key(device_id))
        if existing_device_raw:
            try:
                device_data = json.loads(existing_device_raw)
            except Exception:
                # TODO
                pass

        r.set(
            self.device_key(device_id),
            json.dumps(device_data),
            ex=DEVICE_TTL_SECONDS,
        )
        return device_id

    def get_devices(self) -> list[Device]:
        r = get_default_redis_conn()

        device_ids = r.smembers(self.devices_set_key())
        active_device_raw = r.get(self.active_device_key())
        active_device_id = _decode(active_device_raw) if active_device_raw else None

        devices: list[Device] = []
        for raw_device_id in device_ids:
            device_id = _decode(raw_device_id)
            raw_device = r.get(self.device_key(device_id))
            if not raw_device:
                r.srem(self.devices_set_key(), device_id)
                continue

            try:
                device = json.loads(raw_device)
            except Exception:
                device = {}

            devices.append(
                {
                    "id": device_id,
                    "name": device.get("name", ""),
                    "is_active": device_id == active_device_id,
                }
            )

        return devices

    def set_active_device(self, device_id: str) -> None:
        r = get_default_redis_conn()
        # no ttl, should be cleared explicitely
        r.set(self.active_device_key(), device_id)
        return None

    def clear_device(self, device_id: str) -> None:
        r = get_default_redis_conn()

        r.delete(self.device_key(device_id))
        r.srem(self.devices_set_key(), device_id)

        prev_active = r.get(self.active_device_key())
        prev_active = _decode(prev_active) if prev_active else None

        if prev_active == device_id:
            r.delete(self.active_device_key())
        return None
