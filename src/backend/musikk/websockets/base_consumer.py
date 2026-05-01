from collections.abc import Callable
from logging import getLogger

from asgiref.sync import async_to_sync as atos
from channels.generic.websocket import JsonWebsocketConsumer
from social.ws import TypingHandler
from streaming.ws import DeviceHandler, PlaybackHandler

from websockets.action_handler import WSActionHandler
from websockets.event_helpers import user_group
from websockets.topics import TopicHandler

logger = getLogger(__name__)


class BaseConsumer(JsonWebsocketConsumer):
    """
    The WS connection handler.

    Sends Events which signify server-initiated signals and accepts Actions which are client's requests for changes.
    Each client gets only a single connection. This connection is then multiplexed by using topics to which each client
    subscribes via a `subscribe` action. Each topic can be viewed as a map of type {`topic_key`: set of clients};
    the server is then able to broadcast Events to all clients under a specific topic.

    Examples:
        client -> server:
          - { "action": "device.register", "payload": { "device_id": str, "name": str } }
          - { "action": "subscribe", "payload": { "topic": "chat.<uuid>" } }

        server -> client:
          - { "event": "device.list", "payload": { "devices": [...] } }
          - { "event": "chat.message", "payload": { "messages": [...] } }
    """

    action_handler_classes: list[type[WSActionHandler]] = [
        DeviceHandler,
        PlaybackHandler,
        TopicHandler,
        TypingHandler,
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.user_uuid = None
        self.group_name = None
        # this was defined in TopicHandler, but lifted here because TypingHandler (and mb others in the future)
        # use it as an auth cache instead of re-hitting the DB (in case of typing stuff would be expensive)
        # this is not very good since it mixes subscription state with implicit auth state
        # probably rewrite in the future, but fine for now
        self.subscribed_topics: set[str] = set()
        self._handlers: list[WSActionHandler] = []
        self._action_map: dict[str, Callable] = {}

    def connect(self):
        user = self.scope.get("user")
        if user is None or getattr(user, "is_anonymous", True):
            return

        self.user = user
        self.user_uuid = str(user.uuid)
        self.group_name = user_group(self.user_uuid)

        try:
            atos(self.channel_layer.group_add)(self.group_name, self.channel_name)
        except Exception:
            logger.exception("Failed to add to channel layer")
            return

        self.accept()

        self._handlers = [cls(self) for cls in self.action_handler_classes]
        for handler in self._handlers:
            actions = handler.get_actions()
            # each action key should be owned by exactly one handler
            # probably rewrite in the future, this shouldn't be enforced on the consumer...
            if not self._action_map.keys().isdisjoint(actions.keys()):
                raise ValueError(
                    f"{handler.__class__.__name__} actions already registered "
                )
            self._action_map.update(actions)

        logger.debug(f"WS Conn accepted, user uuid: {user.uuid}")

    def disconnect(self, close_code):
        if self.group_name:
            atos(self.channel_layer.group_discard)(self.group_name, self.channel_name)

        for handler in self._handlers:
            handler.on_disconnect()

    def receive_json(self, content, **kwargs):
        logger.debug(f"Received WS event: {content}")

        action = content.get("action")
        if not action:
            self.send_error("Missing 'action' field")
            return

        payload = content.get("payload") or {}
        handler = self._action_map.get(action)
        if not handler:
            self.send_error(f"Unknown action: {action}")
            return

        handler(payload)

    def ws_event(self, event):
        logger.debug(
            f"Sending WS event event={event['event']} payload={event.get('payload')}",
        )
        self.send_json(
            {
                "event": event["event"],
                "payload": event.get("payload"),
            }
        )

    def send_error(self, message: str):
        self.send_json({"event": "error", "payload": {"message": message}})
