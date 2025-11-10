from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import json


class UserConsumer(WebsocketConsumer):
    def connect(self):
        user = self.scope.get("user")
        if user is None or getattr(user, "is_anonymous", True):
            self.close()
            return

        self.group_name = f"user_{user.uuid}"
        async_to_sync(self.channel_layer.group_add)(self.group_name, self.channel_name)
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.group_name, self.channel_name
        )

    def receive(self, text_data=None, bytes_data=None):
        # TODO: events from user
        pass

    def song_created(self, event):
        self.send(text_data=json.dumps({"event": "song.created"}))
