from enum import StrEnum
from uuid import UUID

from asgiref.sync import async_to_sync as atos
from channels.layers import get_channel_layer


def user_group(uuid: str | UUID) -> str:
    return f"user_{uuid}"


def send_ws_event(
    group_name: str,
    event_name: str | StrEnum,
    exclude_device_id: str | None = None,
    **kwargs,
):
    """
    Send event to WebSocket group.

    Args:
        group_name: WebSocket group name (e.g., "user_{uuid}")
        event_name: the name of the event
        exclude_device_id: don't send to the connection registered for this
            device id (used, e.g., so the author of an action doesn't receive its own echo)
        **kwargs: Event payload
    """
    channel_layer = get_channel_layer()
    message: dict = {"type": "ws_event", "event": event_name, "payload": kwargs}
    if exclude_device_id is not None:
        message["exclude_device_id"] = exclude_device_id
    atos(channel_layer.group_send)(group_name, message)
