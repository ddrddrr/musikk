from django.urls import path

from streaming.api.v1.views import (
    SongDetailView,
    SongCollectionLatestView,
    SongCollectionDetailView,
    SongCollectionUserView,
    SongCollectionCreateView,
    SongCollectionAddLikedView,
    SongCreateView,
    SongAddLikedVIew,
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
    path("songs/<uuid:uuid>", SongDetailView.as_view(), name="song-detail"),
    path("songs", SongCreateView.as_view(), name="songs-upload"),
    path("collections", SongCollectionCreateView.as_view(), name="collection-create"),
    path(
        "collections/latest", SongCollectionLatestView.as_view(), name="collection-list"
    ),
    path(
        "collections/personal",
        SongCollectionUserView.as_view(),
        name="collection-user-list",
    ),
    path(
        "collections/<uuid:uuid>",
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
        SongAddLikedVIew.as_view(),
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
        "song-queue/set-head/<uuid:uuid>",
        SongQueueSetSongHeadView.as_view(),
        name="song-queue-set-head",
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
]
