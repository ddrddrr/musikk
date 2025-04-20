class EventMessageType:
    invalidate_query = "invalidate"


class EventChannels:
    notifications = f"notifications/events"

    @staticmethod
    def comments(obj_uuid):
        return f"comments/events/{obj_uuid}"
