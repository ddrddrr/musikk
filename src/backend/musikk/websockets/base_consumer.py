from asgiref.sync import async_to_sync as atos
from channels.generic.websocket import JsonWebsocketConsumer

"""
client -> server
"action":"queue.shift",
"payload": some json

server -> client
"event":"song.uploaded",
"payload": some json
"""


class BaseConsumer(JsonWebsocketConsumer):
    def connect(self):
        user = self.scope.get("user")
        if user is None or getattr(user, "is_anonymous", True):
            self.close()
            return

        self.group_name = f"user_{user.uuid}"
        atos(self.channel_layer.group_add)(self.group_name, self.channel_name)
        self.accept()

    def disconnect(self, close_code):
        atos(self.channel_layer.group_discard)(self.group_name, self.channel_name)

    def receive_json(self, content, **kwargs):
        match content:
            case {"action": "test.event", "payload": payload}:
                pass
            case _:
                atos(self.channel_layer.send)(
                    self.group_name, {"type": "test.base_msg", "payload": "aboba"}
                )

    def base_event(self, event):
        self.send_json(
            {
                "event": event["event"],
                "payload": event.get("payload"),
            }
        )
