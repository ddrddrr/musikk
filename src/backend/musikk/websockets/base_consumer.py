from logging import getLogger

from asgiref.sync import async_to_sync as atos
from channels.generic.websocket import JsonWebsocketConsumer
from social.ws import TypingWSActionService
from streaming.ws.action_services.device import DeviceWSActionService
from streaming.ws.action_services.playback import PlaybackWSActionService

from websockets.action_service import WSAction, WSActionService
from websockets.event_helpers import user_group
from websockets.topics import TopicWSActionService

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
          - { "event": "device.list", "payload": { "current_song": {...}, "devices": [...], ... } }
          - { "event": "chat.message", "payload": { "messages": [...] } }
    """

    action_service_classes: list[type[WSActionService]] = [
        DeviceWSActionService,
        PlaybackWSActionService,
        TopicWSActionService,
        TypingWSActionService,
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.user_uuid = None
        self.group_name = None
        self.device_id: str | None = None
        # this was defined in TopicWSActionService, but lifted here because TypingWSActionService (and mb others in the future)
        # use it as an auth cache instead of re-hitting the DB (in case of typing stuff would be expensive)
        # this is not very good since it mixes subscription state with implicit auth state
        # probably rewrite in the future, but fine for now
        self.subscribed_topics: set[str] = set()
        self._action_services: list[WSActionService] = []
        self._action_map: dict[str, WSAction] = {}

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

        self._action_services = [cls(self) for cls in self.action_service_classes]
        for service in self._action_services:
            actions = service.get_actions()
            # each action key should be owned by exactly one handler
            # probably rewrite in the future, this shouldn't be enforced on the consumer...
            if not self._action_map.keys().isdisjoint(actions.keys()):
                raise ValueError(
                    f"{service.__class__.__name__} actions already registered "
                )
            self._action_map.update(actions)

        logger.debug(f"WS Conn accepted, user uuid: {user.uuid}")

    def disconnect(self, close_code):
        if self.group_name:
            atos(self.channel_layer.group_discard)(self.group_name, self.channel_name)

        for service in self._action_services:
            service.on_disconnect()

    def receive_json(self, content, **kwargs):
        logger.debug(f"Received WS event: {content}")

        if not isinstance(content, dict):
            self.send_error("Expected a JSON object")
            return

        action_name = content.get("action")
        if not action_name:
            self.send_error("Missing 'action' field")
            return

        action = (
            self._action_map.get(action_name) if isinstance(action_name, str) else None
        )
        if not action:
            self.send_error(f"Unknown action: {action_name}")
            return

        serializer = action["serializer"](data=content.get("payload", {}))
        if not serializer.is_valid():
            if action["on_invalid"] == "error":
                self.send_error(
                    f"Invalid {action_name} payload: {_join_errors(serializer.errors)}"
                )
            else:
                logger.debug(
                    f"Dropped invalid {action_name} payload: {serializer.errors}"
                )
            return

        action["handler"](serializer.validated_data)

    def ws_event(self, event):
        """
        A method that should be used for all outbound ws events

        Django Channels resolves the `type` key of a group_send message to a
        method on the consumer (dots -> underscores, I know...),
        so group_send should be called as:

            channel_layer.group_send(group, {
                "type": "ws_event",
                "event": "<server-event-name>",
                "payload": {...},
                "exclude_device_id": "<device-uuid>",  # optional
            })
        """
        exclude_device_id = event.get("exclude_device_id")
        if exclude_device_id is not None and exclude_device_id == self.device_id:
            return
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


def _join_errors(errors: dict[str, list[str]]) -> str:
    parts = [f"{field}: {' '.join(messages)}" for field, messages in errors.items()]
    return " ".join(parts)
