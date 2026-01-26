from django.urls import path

from streaming.api.v1.views import (
    FriendsLatestListenedView,
)
from streaming.api.v1.views.profile import StreamingProfileRetrieveView

from streaming.api.v1.views.songs import (
    SongAddLikedView,
    CollectionSongRetrieveView,
)
from streaming.api.v1.views.collections import (
    CollectionListCreateView,
    CollectionPersonalView,
    CollectionDetailView,
    CollectionAddLikedView,
    CollectionRemoveSong,
    AlbumBySongView,
    CollectionRetrieveView, CollectionSongCreateView,
)

from streaming.api.v1.views.song_queue import (
    SongQueueRetrieveView,
    SongQueueAddSongView,
    SongQueueAddCollectionView,
    SongQueueSetSongHeadView,
    SongQueueSetCollectionHeadView,
    SongQueueAppendRandomSongsView,
    SongQueueRemoveNodeView,
    SongQueueClearView,
    SongQueueShiftHeadView,
    SongQueueShiftHeadBackwardsView,
)

song_urls = [
    path(
        "liked-songs/add-song/<uuid:uuid>",
        SongAddLikedView.as_view(),
        name="liked-songs-add",
    ),
    path(
        "songs/<uuid:uuid>",
        CollectionSongRetrieveView.as_view(),
        name="song-retrieve",
    ),
    path("songs/<uuid:uuid>/album", AlbumBySongView.as_view(), name="album-by-song"),
]

collection_urls = [
    path(
        "collections", CollectionListCreateView.as_view(), name="collection-list-create"
    ),
    path(
        "collections/<uuid:collection_uuid>/songs",
        CollectionSongCreateView.as_view(),
        name="collection-song-create",
    ),
    path(
        "collections/<uuid:collection_uuid>/songs/<uuid:song_uuid>/remove",
        CollectionRemoveSong.as_view(),
        name="collection-remove-song",
    ),
    path(
        "collections/personal/<uuid:uuid>",
        CollectionPersonalView.as_view(),
        name="collection-user-list",
    ),
    path(
        "collections/<uuid:uuid>",
        CollectionRetrieveView.as_view(),
        name="collection-retrieve",
    ),
    path(
        "collections/detail/<uuid:uuid>",
        CollectionDetailView.as_view(),
        name="collection-detail",
    ),
    path(
        "collections/<uuid:uuid>/like",
        CollectionAddLikedView.as_view(),
        name="collection-add-liked",
    ),
]

song_queue_urls = [
    path("song-queue", SongQueueRetrieveView.as_view(), name="song-queue-retrieve"),
    path(
        "song-queue/add-song/<uuid:uuid>",
        SongQueueAddSongView.as_view(),
        name="song-queue-add-song",
    ),
    path(
        "song-queue/add-collection/<uuid:uuid>",
        SongQueueAddCollectionView.as_view(),
        name="song-queue-add-collection",
    ),
    path(
        "song-queue/set-head-song/<uuid:uuid>",
        SongQueueSetSongHeadView.as_view(),
        name="song-queue-set-head-song",
    ),
    path(
        "song-queue/set-head-collection/<uuid:uuid>",
        SongQueueSetCollectionHeadView.as_view(),
        name="song-queue-set-head-collection",
    ),
    path(
        "song-queue/remove-node/<uuid:uuid>",
        SongQueueRemoveNodeView.as_view(),
        name="song-queue-remove-node",
    ),
    path("song-queue/clear", SongQueueClearView.as_view(), name="song-queue-clear"),
    path(
        "song-queue/append-random",
        SongQueueAppendRandomSongsView.as_view(),
        name="song-queue-append-random",
    ),
    path(
        "song-queue/shift-head",
        SongQueueShiftHeadView.as_view(),
        name="song-queue-shift-head",
    ),
    path(
        "song-queue/shift-head-backwards",
        SongQueueShiftHeadBackwardsView.as_view(),
        name="song-queue-shift-head-backwards",
    ),
    path(
        "song-queue/shift-head/<uuid:uuid>",
        SongQueueShiftHeadView.as_view(),
        name="song-queue-shift-head-to",
    ),
]


friend_activity_urls = [
    path(
        "friend-activity/active-songs",
        FriendsLatestListenedView.as_view(),
        name="friends-listening-activity",
    ),
]

streaming_profile_urls = [
    path(
        "streaming-profile",
        StreamingProfileRetrieveView.as_view(),
        name="streaming-profile",
    )
]
urlpatterns = (
    song_urls
    + collection_urls
    + song_queue_urls
    + friend_activity_urls
    + streaming_profile_urls
)
