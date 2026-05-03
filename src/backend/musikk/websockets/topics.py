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


def parse_topic(topic: str) -> tuple[str, str] | None:
    prefix, _, topic_id = topic.partition(".")
    if not prefix or not topic_id:
        return None
    return prefix, topic_id


class TopicWSActionHandler(WSActionHandler):
    """Generic pub/sub over Channels groups.

    Flow:
      1. A feature registers an auth rule with `@topic_validator("<prefix>")`.
      2. Client sends `{action: "subscribe", topic: "<prefix>.<id>"}`.
        The validator decides if the user may join, and on success the channel
        is added to the Channels group `topic.<prefix>.<id>` and tracked on
        `consumer.subscribed_topics`.
      3. Producers broadcast to the same group via `topic_group(prefix, id)`,
        so subscribers and publishers stay in sync on the group name.
      4. On disconnect every joined group is dropped to avoid leaks.
    """

    def get_actions(self) -> dict[str, Callable]:
        return {
            "subscribe": self.handle_subscribe,
            "unsubscribe": self.handle_unsubscribe,
        }

    def on_disconnect(self):
        for group in self.consumer.subscribed_topics:
            atos(self.consumer.channel_layer.group_discard)(
                group, self.consumer.channel_name
            )
        self.consumer.subscribed_topics.clear()

    def handle_subscribe(self, payload: dict):
        parsed = parse_topic(payload.get("topic", ""))
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
        self.consumer.subscribed_topics.add(group)

    def handle_unsubscribe(self, payload: dict):
        parsed = parse_topic(payload.get("topic", ""))
        if not parsed:
            return

        group = topic_group(*parsed)
        if group in self.consumer.subscribed_topics:
            atos(self.consumer.channel_layer.group_discard)(
                group, self.consumer.channel_name
            )
            self.consumer.subscribed_topics.discard(group)
