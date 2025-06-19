from enum import Enum

from django_eventstream import send_event


class Event:
    class EventType(Enum):
        INVALIDATE = "invalidate"
        UPLOAD = "upload"

    @staticmethod
    def invalidate_event(channel, query_key: list):
        send_event(
            channel,
            Event.EventType.INVALIDATE.value,
            data=query_key,
        )

    @staticmethod
    def upload_event(channel, operation_id: str, status: str):
        send_event(
            channel,
            Event.EventType.UPLOAD.value,
            data={"operation_id": operation_id, "status": status},
        )
