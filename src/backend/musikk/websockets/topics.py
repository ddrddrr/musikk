from collections.abc import Callable

from asgiref.sync import async_to_sync as atos
from users.models import BaseUser

from websockets.action_service import WSAction, WSActionService
from websockets.serializers import TopicSerializer

type TopicValidator = Callable[[BaseUser, str], bool]

TOPIC_VALIDATORS: dict[str, TopicValidator] = {}


def topic_validator(prefix: str):
    def decorator(func: TopicValidator) -> TopicValidator:
        TOPIC_VALIDATORS[prefix] = func
        return func

    return decorator


def topic_group(prefix: str, topic_id: str) -> str:
    return f"topic.{prefix}.{topic_id}"


class TopicWSActionService(WSActionService):
    """
    Generic pub/sub over Channels groups. Features register a validator with
    `@topic_validator("<prefix>")`, producers send via `topic_group(prefix, id)`
    """

    def get_actions(self) -> dict[str, WSAction]:
        return {
            "subscribe": {
                "handler": self.handle_subscribe,
                "serializer": TopicSerializer,
                "on_invalid": "error",
            },
            "unsubscribe": {
                "handler": self.handle_unsubscribe,
                "serializer": TopicSerializer,
                "on_invalid": "drop",
            },
        }

    def on_disconnect(self):
        for group in self.consumer.subscribed_topics:
            atos(self.consumer.channel_layer.group_discard)(
                group, self.consumer.channel_name
            )
        self.consumer.subscribed_topics.clear()

    def handle_subscribe(self, payload: dict):
        prefix, topic_id = payload["topic"]
        validator = TOPIC_VALIDATORS.get(prefix)
        if not validator:
            self.consumer.send_error(f"Unknown topic type: {prefix}")
            return

        if not validator(self.consumer.user, topic_id):
            self.consumer.send_error(f"Not authorized for {prefix}.{topic_id}")
            return

        group = topic_group(prefix, topic_id)
        atos(self.consumer.channel_layer.group_add)(group, self.consumer.channel_name)
        self.consumer.subscribed_topics.add(group)

    def handle_unsubscribe(self, payload: dict):
        group = topic_group(*payload["topic"])
        if group in self.consumer.subscribed_topics:
            atos(self.consumer.channel_layer.group_discard)(
                group, self.consumer.channel_name
            )
            self.consumer.subscribed_topics.discard(group)
