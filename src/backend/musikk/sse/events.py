from django_eventstream import send_event


def send_invalidate_event(channel, query_key: list):
    send_event(
        channel,
        "message",
        {"invalidate": query_key},
    )
