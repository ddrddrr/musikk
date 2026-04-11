from enum import StrEnum

from social.models.chat import ChatMember
from streaming.models import Collection
from users.models import BaseUser
from websockets.topics import topic_validator


class ServerEvent(StrEnum):
    COLLECTION_COMMENTS_CHANGED = "collection.comments.changed"
    FEED_COMMENTS_CHANGED = "feed.comments.changed"
    CHAT_MESSAGES_CHANGED = "chat.messages.changed"


@topic_validator("chat")
def validate_chat(user: BaseUser, topic_id: str) -> bool:
    return ChatMember.objects.filter(chat__uuid=topic_id, member=user).exists()


@topic_validator("collection_comments")
def validate_collection_comments(user: BaseUser, topic_id: str) -> bool:
    return Collection.objects.filter(uuid=topic_id, private=False).exists()


@topic_validator("feed")
def validate_feed(user: BaseUser, topic_id: str) -> bool:
    return BaseUser.objects.filter(uuid=topic_id).exists()
