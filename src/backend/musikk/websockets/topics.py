from collections.abc import Callable

from asgiref.sync import async_to_sync as atos

from users.models import BaseUser
from websockets.action_handler import WSActionHandler

type TopicValidator = Callable[[BaseUser, str], bool]

TOPIC_VALIDATORS: dict[str, TopicValidator] = {}


def topic_validator(prefix: str):
    def decorator(func: TopicValidator) -> TopicValidator:
        TOPIC_VALIDATORS[prefix] = func
        return func

    return decorator


def topic_group(prefix: str, topic_id: str) -> str:
    return f"topic.{prefix}.{topic_id}"


class TopicHandler(WSActionHandler):
    def __init__(self, consumer):
        super().__init__(consumer)
        self._subscribed: set[str] = set()

    def get_actions(self) -> dict[str, Callable]:
        return {
            "subscribe": self.handle_subscribe,
            "unsubscribe": self.handle_unsubscribe,
        }

    def on_disconnect(self):
        for group in self._subscribed:
            atos(self.consumer.channel_layer.group_discard)(
                group, self.consumer.channel_name
            )

    def handle_subscribe(self, payload: dict):
        parsed = self._parse_topic(payload.get("topic", ""))
        if not parsed:
            self.consumer.send_error("Invalid topic format, expected 'type.id'")
            return

        prefix, topic_id = parsed
        validator = TOPIC_VALIDATORS.get(prefix)
        if not validator:
            self.consumer.send_error(f"Unknown topic type: {prefix}")
            return

        if not validator(self.consumer.user, topic_id):
            self.consumer.send_error(f"Not authorized for {prefix}.{topic_id}")
            return

        group = topic_group(prefix, topic_id)
        atos(self.consumer.channel_layer.group_add)(group, self.consumer.channel_name)
        self._subscribed.add(group)

    def handle_unsubscribe(self, payload: dict):
        parsed = self._parse_topic(payload.get("topic", ""))
        if not parsed:
            return

        group = topic_group(*parsed)
        if group in self._subscribed:
            atos(self.consumer.channel_layer.group_discard)(
                group, self.consumer.channel_name
            )
            self._subscribed.discard(group)

    @staticmethod
    def _parse_topic(topic: str) -> tuple[str, str] | None:
        prefix, _, topic_id = topic.partition(".")
        if not prefix or not topic_id:
            return None
        return prefix, topic_id
