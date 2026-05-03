from enum import StrEnum


class ServerEvent(StrEnum):
    DEVICE_LIST = "device.list"
    PLAYBACK_SEEK = "playback.seek"
    PLAYBACK_SNAPSHOT = "playback.snapshot"
    PLAYBACK_TICK = "playback.tick"
    QUEUE_CHANGED = "queue.changed"
    # TODO: rename to collection open changed
    COLLECTION_CHANGED = "collection.changed"
    COLLECTIONS_PERSONAL_CHANGED = "collections.personal.changed"
    SONG_UPLOAD = "song.upload"
