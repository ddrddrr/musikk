from .api.v1 import consumers

# This module exposes routing information for Channels URLRouter.
# It is imported from musikk.asgi: import streaming.routing
# Note: Channels routing expects an iterable named `websocket_urlpatterns`.
from django.urls import re_path

websocket_urlpatterns = [
    re_path(r"ws/user/?$", consumers.UserConsumer.as_asgi()),
]
