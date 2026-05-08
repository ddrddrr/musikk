from typing import Any


def try_decode(value) -> Any | None:
    try:
        return value.decode()
    except Exception:
        return None
