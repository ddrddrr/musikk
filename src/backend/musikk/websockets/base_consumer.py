from logging import getLogger

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

logger = getLogger(__name__)


class BaseConsumer(JsonWebsocketConsumer):

    def connect(self):
        logger.debug("WS Conn received")
        user = self.scope.get("user")
        logger.debug(f"User: {user}")

        if user is None or getattr(user, "is_anonymous", True):
            self.close()
            return

        self.group_name = f"user_{user.uuid}"
        logger.debug(f"Attempting to add to group: {self.group_name}")

        try:
            atos(self.channel_layer.group_add)(self.group_name, self.channel_name)
            logger.debug("Successfully added to channel layer group")
        except Exception as e:
            logger.error(f"Failed to add to channel layer: {e}")
            self.close()
            return

        self.accept()
        logger.debug("WS Conn accepted")

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
