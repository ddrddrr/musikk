from enum import StrEnum


class ServerEvent(StrEnum):
    COLLECTION_COMMENTS_CHANGED = "collection.comments.changed"
    FEED_COMMENTS_CHANGED = "feed.comments.changed"
    CHAT_MESSAGES_CHANGED = "chat.messages.changed"
