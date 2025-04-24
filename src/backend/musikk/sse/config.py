class EventMessageType:
    invalidate_query = "invalidate"


class EventChannels:
    notifications = f"notifications/events"

    @staticmethod
    def song_queue(user_uuid):
        return f"song-queue/events/{user_uuid}"

    @staticmethod
    def comments(obj_uuid):
        return f"comments/events/{obj_uuid}"
