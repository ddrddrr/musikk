class EventMessageType:
    invalidate_query = "invalidate"


class EventChannels:
    @staticmethod
    def user_events(user_uuid):
        return f"events/user/{user_uuid}"
