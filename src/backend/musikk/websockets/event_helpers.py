from collections.abc import Mapping
from enum import StrEnum
from uuid import UUID

from asgiref.sync import async_to_sync as atos
from channels.layers import get_channel_layer


def user_group(uuid: str | UUID) -> str:
    return f"user_{uuid}"


def _serialize_ws_payload(value):
    """Serialize the data before sending by WS layer, so msgpack serializer
    (used by channels_redis) can send the message
    """
    # only uuid for now, other types are serialized properly
    # mb add support for dataclasses so we don't need to call dict conversion in code
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, Mapping):
        return {k: _serialize_ws_payload(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialize_ws_payload(v) for v in value]
    return value


def send_ws_event(
    group_name: str,
    event_name: str | StrEnum,
    exclude_device_id: str | None = None,
    **kwargs,
):
    """Send event to a WebSocket group"""
    channel_layer = get_channel_layer()
    message: dict = {
        "type": "ws_event",
        "event": event_name,
        "payload": _serialize_ws_payload(kwargs),
    }
    if exclude_device_id is not None:
        message["exclude_device_id"] = exclude_device_id
    atos(channel_layer.group_send)(group_name, message)


def send_ws_event_to_channel(
    channel_layer,
    channel_name: str,
    event_name: str | StrEnum,
    **kwargs,
):
    """Send event to a single WebSocket channel"""
    atos(channel_layer.send)(
        channel_name,
        {
            "type": "ws_event",
            "event": event_name,
            "payload": _serialize_ws_payload(kwargs),
        },
    )
