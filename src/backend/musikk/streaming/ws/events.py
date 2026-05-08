from enum import StrEnum


class ServerEvent(StrEnum):
    DEVICE_LIST = "device.list"
    PLAYBACK_SEEK = "playback.seek"
    PLAYBACK_SNAPSHOT = "playback.snapshot"
    QUEUE_CHANGED = "queue.changed"
    # TODO: rename to collection open changed
    COLLECTION_CHANGED = "collection.changed"
    LIBRARY_CHANGED = "user.library.changed"
    LIKED_SONGS_CHANGED = "user.liked_songs.changed"
    LIKED_COLLECTIONS_CHANGED = "user.liked_collections.changed"
    SONG_UPLOAD = "song.upload"
