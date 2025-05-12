from django.urls import path

from streaming.api.v1.views_song import SongAddLikedView, SongCreateView, SongCollectionSongRetrieveView
from streaming.api.v1.views_collection import SongCollectionLatestView, SongCollectionPersonalView, \
    SongCollectionDetailView, SongCollectionAddLikedView, SongCollectionRemoveSong, SongCollectionAddSong, \
    SongCollectionCreateView
from streaming.api.v1.views_playback import (
    PlaybackRetrieveView,
    PlaybackActivateView,
    PlaybackStopView,
    RegisterPlaybackDevice,
)
from streaming.api.v1.views_song_queue import (
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

urlpatterns = [
    path("songs", SongCreateView.as_view(), name="songs-upload"),
    path("songs/<uuid:uuid>", SongCollectionSongRetrieveView.as_view(), name="song-retrieve"),
    path("collections", SongCollectionCreateView.as_view(), name="collection-create"),
    path(
        "collections/<uuid:collection_uuid>/songs/<uuid:song_uuid>",
        SongCollectionRemoveSong.as_view(),
        name="collection-remove-song",
    ),
    path(
        "collections/<uuid:collection_uuid>/songs/<uuid:song_uuid>",
        SongCollectionAddSong.as_view(),
        name="collection-add-song",
    ),
    path(
        "collections/latest", SongCollectionLatestView.as_view(), name="collection-list"
    ),
    path(
        "collections/personal",
        SongCollectionPersonalView.as_view(),
        name="collection-user-list",
    ),
    path(
        "collections/<uuid:uuid>",
        SongCollectionDetailView.as_view(),
        name="collection-retrieve",
    ),
    path(
        "collections/detail/<uuid:uuid>",
        SongCollectionDetailView.as_view(),
        name="collection-detail",
    ),
    path(
        "collections/<uuid:uuid>/like",
        SongCollectionAddLikedView.as_view(),
        name="collection-add-liked",
    ),
    path(
        "liked-songs/add-song/<uuid:uuid>",
        SongAddLikedView.as_view(),
        name="liked-songs-add",
    ),
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
    path(
        "song-queue/clear",
        SongQueueClearView.as_view(),
        name="song-queue-clear",
    ),
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
    path("playback", PlaybackRetrieveView.as_view(), name="playback-retrieve"),
    path("playback/activate", PlaybackActivateView.as_view(), name="playback-activate"),
    path("playback/stop", PlaybackStopView.as_view(), name="playback-stop"),
    path("playback-device", RegisterPlaybackDevice.as_view(), name="playback-device"),
]
