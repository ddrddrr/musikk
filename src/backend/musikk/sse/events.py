from django_eventstream import send_event


def send_invalidate_event(channel):
    send_event(
        channel,
        "message",
        {"invalidate": ""},
    )
