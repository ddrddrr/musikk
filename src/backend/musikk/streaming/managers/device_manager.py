import json
from typing import TypedDict

from redis_helpers import get_default_redis_conn
from utils.data import try_decode

# heartbeat TTL seconds
# 2x the 3s FE heartbeat + 1s so a single missed beat doesn't remove active device
DEVICE_TTL_SECONDS = 7


DEFAULT_VOLUME = 100


class Device(TypedDict):
    id: str
    name: str
    is_active: bool
    volume: int


class DeviceManager:
    def __init__(self, user_uuid: str):
        self._device_key_base = f"user:{user_uuid}"

    def _device_key(self, device_id: str) -> str:
        return self._device_key_base + f":device:{device_id}"

    def _devices_set_key(self) -> str:
        return self._device_key_base + ":devices"

    def _active_device_key(self) -> str:
        return self._device_key_base + ":active_device"

    def register_device(
        self,
        device_id: str,
        name: str | None = None,
        volume: int = DEFAULT_VOLUME,
    ) -> str:
        r = get_default_redis_conn()

        device_data = {"name": name, "volume": volume}
        r.set(
            self._device_key(device_id),
            json.dumps(device_data),
            ex=DEVICE_TTL_SECONDS,
        )
        r.sadd(self._devices_set_key(), device_id)
        return device_id

    def touch_device(self, device_id: str) -> str:
        r = get_default_redis_conn()

        device_data = {}
        existing_device_raw = r.get(self._device_key(device_id))
        if existing_device_raw:
            try:
                device_data = json.loads(existing_device_raw)
            except Exception:
                # TODO
                pass

        r.set(
            self._device_key(device_id),
            json.dumps(device_data),
            ex=DEVICE_TTL_SECONDS,
        )
        return device_id

    def get_active_device_id(self) -> str | None:
        r = get_default_redis_conn()
        raw = r.get(self._active_device_key())
        return try_decode(raw) if raw else None

    def get_devices(self) -> list[Device]:
        r = get_default_redis_conn()

        device_ids = r.smembers(self._devices_set_key())
        active_device_id = self.get_active_device_id()

        devices: list[Device] = []
        for raw_device_id in device_ids:
            device_id = try_decode(raw_device_id)
            raw_device = r.get(self._device_key(device_id))
            if not raw_device:
                r.srem(self._devices_set_key(), device_id)
                continue

            try:
                device = json.loads(raw_device)
            except Exception:
                device = {}

            devices.append(
                Device(
                    id=device_id,
                    name=device.get("name", ""),
                    is_active=device_id == active_device_id,
                    volume=device.get("volume", DEFAULT_VOLUME),
                )
            )

        return devices

    def set_active_device(self, device_id: str) -> bool:
        r = get_default_redis_conn()
        prev_active = try_decode(r.get(self._active_device_key()))
        if prev_active == device_id:
            return False
        # no ttl, should be cleared explicitely
        r.set(self._active_device_key(), device_id)
        return True

    def set_device_volume(self, device_id: str, volume: int) -> None:
        r = get_default_redis_conn()

        device_data: dict = {}
        existing_raw = r.get(self._device_key(device_id))
        if existing_raw:
            try:
                device_data = json.loads(existing_raw)
            except Exception:
                pass

        device_data["volume"] = volume
        # set the same ttl as before since device 1 can update the
        # volume of device 2
        ttl = r.ttl(self._device_key(device_id))
        r.set(
            self._device_key(device_id),
            json.dumps(device_data),
            ex=ttl if ttl > 0 else DEVICE_TTL_SECONDS,
        )

    def clear_device(self, device_id: str) -> bool:
        r = get_default_redis_conn()

        r.delete(self._device_key(device_id))
        r.srem(self._devices_set_key(), device_id)

        prev_active = r.get(self._active_device_key())
        prev_active = try_decode(prev_active) if prev_active else None

        if prev_active == device_id:
            r.delete(self._active_device_key())
            return True
        return False
