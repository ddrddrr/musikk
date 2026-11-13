import time
from enum import StrEnum

from asgiref.sync import async_to_sync as atos
from websockets.action_service import WSAction, WSActionService
from websockets.serializers import TopicSerializer
from websockets.topics import topic_group, topic_validator

from social.publication_access_policies import (
    PUBLICATION_ACCESS_POLICY_BY_MODEL,
    PublicationAccessPolicy,
)


class ServerEvent(StrEnum):
    COLLECTION_COMMENTS_CHANGED = "collection.comments.changed"
    SONG_COMMENTS_CHANGED = "song.comments.changed"
    CHAT_MESSAGES_CHANGED = "chat.messages.changed"


PUBLICATION_ACCESS_POLICIES_WITH_WS_TOPIC: tuple[PublicationAccessPolicy, ...] = tuple(
    policy
    for policy in PUBLICATION_ACCESS_POLICY_BY_MODEL.values()
    if policy.ws_topic_prefix is not None
)


def _register_publication_topic_validators() -> None:
    """
    A publication topic, such as `chat.<uuid>`, lets in exactly the users who
    can read the publications of that object.
    """
    for policy in PUBLICATION_ACCESS_POLICIES_WITH_WS_TOPIC:
        topic_validator(policy.ws_topic_prefix)(policy.can_read_publications_by_uuid)


_register_publication_topic_validators()


class TypingWSActionService(WSActionService):
    # minimum gap between typing sends
    MIN_INTERVAL = 2  # sec
    PREFIX_TO_EVENT: dict[str, str] = {
        policy.ws_topic_prefix: f"{policy.ws_topic_prefix}.typing"
        for policy in PUBLICATION_ACCESS_POLICIES_WITH_WS_TOPIC
    }

    def __init__(self, consumer):
        super().__init__(consumer)
        # this is curr per-connection, not per-user/device
        # can lead to a bit of a bad ux and can be abused
        # (e.g., multiple sends from diff tabs/a ton of connections per-user), but fine for now
        self._last_sent: dict[str, float] = {}

    def get_actions(self) -> dict[str, WSAction]:
        return {
            "typing": {
                "handler": self.handle_typing,
                "serializer": TopicSerializer,
                "on_invalid": "drop",
            }
        }

    def handle_typing(self, payload: dict):
        prefix, topic_id = payload["topic"]
        group = topic_group(prefix, topic_id)
        # check that the user is actually in the chat/comments
        if group not in self.consumer.subscribed_topics:
            return

        if not (event_name := self.PREFIX_TO_EVENT.get(prefix)):
            return

        now = time.monotonic()
        if now - self._last_sent.get(group, 0.0) < self.MIN_INTERVAL:
            return
        self._last_sent[group] = now

        user = self.consumer.user
        atos(self.consumer.channel_layer.group_send)(
            group,
            {
                "type": "ws_event",
                "event": event_name,
                "payload": {
                    "user_uuid": str(user.uuid),
                    "display_name": user.display_name,
                },
            },
        )
