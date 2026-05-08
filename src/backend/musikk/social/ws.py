import time
from collections.abc import Callable
from enum import StrEnum

from asgiref.sync import async_to_sync as atos
from streaming.models import Collection
from users.models import BaseUser
from websockets.action_handler import WSActionHandler
from websockets.topics import parse_topic, topic_group, topic_validator

from social.models.chat import ChatMember


class ServerEvent(StrEnum):
    COLLECTION_COMMENTS_CHANGED = "collection.comments.changed"
    CHAT_MESSAGES_CHANGED = "chat.messages.changed"
    CHAT_TYPING = "chat.typing"
    COLLECTION_COMMENTS_TYPING = "collection_comments.typing"


@topic_validator("chat")
def validate_chat(user: BaseUser, topic_id: str) -> bool:
    return ChatMember.objects.filter(chat__uuid=topic_id, member=user).exists()


@topic_validator("collection_comments")
def validate_collection_comments(user: BaseUser, topic_id: str) -> bool:
    return Collection.objects.filter(uuid=topic_id, private=False, draft=False).exists()


class TypingWSActionHandler(WSActionHandler):
    # minimum gap between typing sends
    MIN_INTERVAL = 2  # sec
    PREFIX_TO_EVENT: dict[str, str] = {
        "chat": ServerEvent.CHAT_TYPING,
        "collection_comments": ServerEvent.COLLECTION_COMMENTS_TYPING,
    }

    def __init__(self, consumer):
        super().__init__(consumer)
        # this is curr per-connection, not per-user/device
        # can lead to a bit of a bad ux and can be abused
        # (e.g., multiple sends from diff tabs/a ton of connections per-user), but fine for now
        self._last_sent: dict[str, float] = {}

    def get_actions(self) -> dict[str, Callable]:
        return {"typing": self.handle_typing}

    def handle_typing(self, payload: dict):
        parsed = parse_topic(payload.get("topic", ""))
        if not parsed:
            return

        prefix, topic_id = parsed
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
