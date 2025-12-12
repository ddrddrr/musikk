from asgiref.sync import async_to_sync as atos
from channels.layers import get_channel_layer


def send_ws_event(group_name: str, event_name: str, **kwargs):
    """
    Send event to WebSocket group.

    Args:
        group_name: WebSocket group name (e.g., "user_{uuid}")
        event_name: the name of the event
        **kwargs: Event payload
    """
    channel_layer = get_channel_layer()
    atos(channel_layer.group_send)(
        group_name, {"type": "ws_event", "event": event_name, "payload": kwargs}
    )
