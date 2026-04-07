from enum import StrEnum


class ServerEvent(StrEnum):
    PLAYBACK_CHANGE = "playback.change"
    QUEUE_CHANGED = "queue.changed"
    # TODO: rename to collection open changed
    COLLECTION_CHANGED = "collection.changed"
    COLLECTIONS_PERSONAL_CHANGED = "collections.personal.changed"
    SONG_UPLOAD = "song.upload"
    FRIEND_ACTIVITY_LISTENING_CHANGED = "friend-activity.listening.changed"
