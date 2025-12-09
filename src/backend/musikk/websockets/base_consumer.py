from logging import getLogger

from asgiref.sync import async_to_sync as atos
from channels.generic.websocket import JsonWebsocketConsumer

from streaming.devices.device_manager import DeviceManager
from websockets.status_codes import WebsocketStatusCode

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

    def connect(self):
        logger.debug("WS Conn received")
        user = self.scope.get("user")
        logger.debug(f"WS Conn User: {user}")

        if user is None or getattr(user, "is_anonymous", True):
            self.close(
                code=WebsocketStatusCode.Unauthorized,
                reason="User is not Authenticated.",
            )
            return

        self.user = user
        self.user_uuid = str(user.uuid)
        self.group_name = f"user_{self.user_uuid}"

        logger.debug(f"Attempting to add to group: {self.group_name}")

        try:
            atos(self.channel_layer.group_add)(self.group_name, self.channel_name)
            logger.debug("Successfully added to channel layer group")
        except Exception as e:
            logger.error(f"Failed to add to channel layer: {e}")
            self.close()
            return

        # self.device_manager = DeviceManager(
        #     user_uuid=self.user_uuid,
        #     device_id= # TODO can we get something? or should we register with a sep event not on startup?
        # )

        self.accept()
        logger.debug("WS Conn accepted")

    def disconnect(self, close_code):
        if self.group_name:
            atos(self.channel_layer.group_discard)(self.group_name, self.channel_name)

        # if self.device_manager and self.device_id:
        #     prev_active = self.device_manager.clear_device(self.device_id)
        #     if prev_active:
                # self.device_manager.broadcast_active_diff(
                #     from_device=self.device_id, to_device=None
                # )
            # self.device_manager.broadcast_devices()

    def receive_json(self, content, **kwargs):
        action = content.get("action")
        payload = content.get("payload") or {}

        if not self.device_manager:
            return
        #
        # match action:
        #     case "device.register":
        #         self.handle_device_register(payload)
        #     case "device.heartbeat":
        #         self.handle_device_heartbeat(payload)
        #     case "device.set_active":
        #         self.handle_device_set_active(payload)
        #     case "test.event":
        #         # your test handling here
        #         pass
        #     case _:
        #         atos(self.channel_layer.group_send)(
        #             self.group_name,
        #             {
        #                 "type": "base_event",
        #                 "event": "test.base_msg",
        #                 "payload": "aboba",
        #             },
        #         )

    def handle_device_register(self, payload: dict):
        device_id = payload.get("device_id")
        name = payload.get("name") or "Web Player"

        device_id = self.device_manager.register_or_touch_device(
            device_id=device_id, name=name
        )
        self.device_id = device_id

        self.device_manager.broadcast_devices()

        self.send_json(
            {
                "event": "device.registered",
                "payload": {
                    "device_id": device_id,
                    "name": name,
                },
            }
        )

    def handle_device_heartbeat(self, payload: dict):
        device_id = payload.get("device_id") or self.device_id
        if not device_id:
            return

        self.device_id = device_id
        self.device_manager.heartbeat(device_id=device_id)

    def handle_device_set_active(self, payload: dict):
        device_id = payload.get("device_id")
        if not device_id:
            return

        prev_active, new_active = self.device_manager.set_active_device(
            device_id=device_id
        )
        self.device_manager.broadcast_active_diff(
            from_device=prev_active, to_device=new_active
        )
        self.device_manager.broadcast_devices()

    def base_event(self, event):
        self.send_json(
            {
                "event": event["event"],
                "payload": event.get("payload"),
            }
        )

    def broadcast_devices(self):
        devices = self.get_devices()
        atos(self.channel_layer.group_send)(
            self.group_name,
            {
                "type": "base_event",
                "event": "device.list",
                "payload": {"devices": devices},
            },
        )

    def broadcast_active_diff(
            self, from_device: str | None, to_device: str | None
    ):
        atos(self.channel_layer.group_send)(
            self.group_name,
            {
                "type": "base_event",
                "event": "device.active_changed",
                "payload": {
                    "from": from_device,
                    "to": to_device,
                },
            },
        )