import time


def now_server_ms() -> int:
    return int(time.time() * 1000)
