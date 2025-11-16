from asgiref.sync import async_to_sync as atos
from channels.layers import get_channel_layer


def send_ws_event(group_name: str, event_handler: str, event_name: str, **kwargs):
    """
    Send event to WebSocket group.

    Args:
        group_name: WebSocket group name (e.g., "user_{uuid}")
        event_handler: Event type (e.g., event_handler="base.event", event_name="invalidate.query", "upload.event").
                Should correspond to a method declared in a consumer.
        **kwargs: Event payload
    """
    # TODO: add assert for event_name format?
    channel_layer = get_channel_layer()
    atos(channel_layer.group_send)(
        group_name, {"type": event_handler, "event": event_name, **kwargs}
    )
