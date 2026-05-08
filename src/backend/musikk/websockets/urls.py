from django.urls import re_path
from websockets.base_consumer import BaseConsumer

websocket_urlpatterns = [
    re_path(r"ws/user?$", BaseConsumer.as_asgi()),
]
