from logging import getLogger

from asgiref.sync import async_to_sync as atos
from channels.generic.websocket import JsonWebsocketConsumer

from streaming.managers.device_manager import DeviceManager
from streaming.managers.playback_manager import PlaybackManager
from websockets.status_codes import WebSocketStatusCode

logger = getLogger(__name__)


class BaseConsumer(JsonWebsocketConsumer):
    """
    client -> server:
      { "action": "device.register", "payload": { "device_id"?: str, "name"?: str } }
      { "action": "device.heartbeat", "payload": { "device_id"?: str } }
      { "action": "device.set_active", "payload": { "device_id": str } }

    server -> client:
      { "event": "device.list", "payload": { "devices": [...] } }
      { "event": "device.active_changed", "payload": { "from": str|null, "to": str|null } }
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.user_uuid = None
        self.group_name = None
        self.device_id = None
        self.device_manager: DeviceManager | None = None
        self.playback_manager: PlaybackManager | None = None

    def connect(self):
        user = self.scope.get("user")
        if user is None or getattr(user, "is_anonymous", True):
            self.close(
                code=WebSocketStatusCode.Unauthorized,
                reason="User is not Authenticated.",
            )
            return

        self.user = user
        self.user_uuid = str(user.uuid)
        self.group_name = f"user_{self.user_uuid}"

        try:
            atos(self.channel_layer.group_add)(self.group_name, self.channel_name)
        except Exception as e:
            logger.error(f"Failed to add to channel layer: {e}")
            self.close()
            return

        self.accept()
        self.device_manager = DeviceManager(user_uuid=self.user_uuid)
        self.playback_manager = PlaybackManager(user_uuid=self.user_uuid)
        logger.debug(f"WS Conn accepted, user uuid: {user.uuid}")

    def disconnect(self, close_code):
        if self.group_name:
            atos(self.channel_layer.group_discard)(self.group_name, self.channel_name)

        if self.device_manager and self.device_id:
            self.device_manager.clear_device(self.device_id)
            self.broadcast_devices()

    def receive_json(self, content, **kwargs):
        action = content.get("action")
        payload = content.get("payload") or {}
        if "device" not in action:
            logger.debug(f"Received WS event: {content}")

        match action:
            case "device.register":
                self.handle_device_register(payload)
            case "device.set_active":
                self.handle_device_set_active(payload)
            case "device.heartbeat":
                self.handle_device_heartbeat(payload)
            case "playback.activate":
                self.handle_playback_activate()
            case "playback.stop":
                self.handle_playback_stop()
            case _:
                self.close(
                    code=WebSocketStatusCode.UnknownEvent,
                    reason=f"Unknown WebSocket action received: {action}",
                )
                return

    def ws_event(self, event):
        """Should be used to send all ws events to the client"""
        if "device" not in event["event"]:
            logger.debug(
                f"Sending WS event event={event['event']} payload={event.get('payload')}",
            )
        self.send_json(
            {
                "event": event["event"],
                "payload": event.get("payload"),
            }
        )

    def handle_device_register(self, payload: dict):
        device_id = payload.get("device_id")
        device_name = payload.get("name")
        if not device_id or not device_name:
            self.close(
                code=WebSocketStatusCode.BadRequest,
                reason="`device_id` and `device_name` are required for device.register action",
            )
            return

        self.device_id = device_id
        self.device_manager.register_device(device_id=device_id, name=device_name)
        self.broadcast_devices()

    def handle_device_heartbeat(self, payload: dict):
        device_id: str = payload.get("device_id")
        if not device_id:
            self.close(
                code=WebSocketStatusCode.BadRequest,
                reason="`device_id` is required for device.heartbeat WS action",
            )
            return

        self.device_manager.touch_device(device_id=device_id)
        self.broadcast_devices()

    def handle_device_set_active(self, payload: dict):
        device_id = payload.get("device_id")
        if not device_id:
            self.close(
                code=WebSocketStatusCode.BadRequest,
                reason="`device_id` is required for device.set_active WS action",
            )
            return

        self.device_manager.set_active_device(device_id=device_id)
        self.broadcast_devices()

    def handle_playback_activate(self, *args, **kwargs):
        self.playback_manager.activate()
        self.broadcast_playback_state()

    def handle_playback_stop(self, *args, **kwargs):
        self.playback_manager.stop()
        self.broadcast_playback_state()

    def broadcast_devices(self):
        devices = self.device_manager.get_devices()
        atos(self.channel_layer.group_send)(
            self.group_name,
            {
                "type": "ws_event",
                "event": "device.list",
                "payload": {"devices": devices},
            },
        )

    def broadcast_playback_state(self):
        atos(self.channel_layer.group_send)(
            self.group_name,
            {
                "type": "ws_event",
                "event": "playback.change",
                "payload": {"playback": self.playback_manager.is_playback_active()},
            },
        )
