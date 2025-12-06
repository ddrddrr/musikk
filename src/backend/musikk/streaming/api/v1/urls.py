from django.urls import path

from streaming.api.v1.views import (
    FriendsLatestAddedCollectionsView,
    FriendsLatestListenedView,
)

# from streaming.api.v1.views.connections import (
#     ConnectionsLatestListenedView,
#     ConnectionsLatestAddedView,
# )
from streaming.api.v1.views.songs import (
    SongAddLikedView,
    SongCreateView,
    CollectionSongRetrieveView,
)
from streaming.api.v1.views.collections import (
    CollectionLatestView,
    CollectionPersonalView,
    CollectionDetailView,
    CollectionAddLikedView,
    CollectionRemoveSong,
    CollectionAddSong,
    CollectionCreateView,
    AlbumBySongView,
)
from streaming.api.v1.views.playback import (
    PlaybackDeviceView,
    PlaybackDeviceActivateView,
    PlaybackStateView,
    # PlaybackDeviceDeleteView,
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
    path("songs", SongCreateView.as_view(), name="song-create"),
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
    path("collections", CollectionCreateView.as_view(), name="collection-create"),
    path(
        "collections/<uuid:collection_uuid>/songs/<uuid:song_uuid>",
        CollectionRemoveSong.as_view(),
        name="collection-remove-song",
    ),
    path(
        "collections/<uuid:collection_uuid>/songs/<uuid:song_uuid>",
        CollectionAddSong.as_view(),
        name="collection-add-song",
    ),
    path("collections/latest", CollectionLatestView.as_view(), name="collection-list"),
    path(
        "collections/personal/<uuid:uuid>",
        CollectionPersonalView.as_view(),
        name="collection-user-list",
    ),
    path(
        "collections/<uuid:uuid>",
        CollectionDetailView.as_view(),
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

playback_urls = [
    path("playback", PlaybackStateView.as_view(), name="playback-state"),
    path(
        "playback-device",
        PlaybackDeviceView.as_view(),
        name="playback-device-register",
    ),
    path(
        "playback-device/<uuid:uuid>/activate",
        PlaybackDeviceActivateView.as_view(),
        name="playback-device-activate",
    ),
    # TODO:
    # path(
    #     "playback-device/<uuid:uuid>/delete",
    #     PlaybackDeviceDeleteView.as_view(
    #         authentication_classes=[],
    #         permission_classes=[AllowAny],
    #     ),
    #     name="playback-device-delete",
    # ),
]

friend_activity_urls = [
    path(
        "friend-activity/latest-added",
        FriendsLatestAddedCollectionsView.as_view(),
        name="friends-latest-added",
    ),
    path(
        "friend-activity/active-songs",
        FriendsLatestListenedView.as_view(),
        name="friends-listening-activity",
    ),
]

urlpatterns = (
    song_urls + collection_urls + song_queue_urls + playback_urls + friend_activity_urls
)
