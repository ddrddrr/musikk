# songs/*some filters* --> song list
# songs/uuid --> song data
# songs/uuid/mpd --> song mpd(for dash js)
# collections/*some filters* --> song list
# collections/uuid --> collection data

from django.urls import path

from streaming.api.v1.views import (
    SongCollectionListView,
    SongCollectionDetailView,
    SongListCreateView,
)
from streaming.api.v1.song_queue_views import SongQueueRetrieveView, SongQueueAddSongView, SongQueueAddCollectionView, \
    SongQueueSetSongHeadView, SongQueueSetCollectionHeadView, SongQueueAppendRandomSongsView, SongQueueRemoveNodeView, \
    SongQueueClearView, SongQueueShiftHeadView

urlpatterns = [
    path("songs/", SongListCreateView.as_view(), name="song-list-create"),
    path("collections/", SongCollectionListView.as_view(), name="collection-list"),
    path(
        "collections/<uuid:uuid>",
        SongCollectionDetailView.as_view(),
        name="collection-detail",
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
        "song-queue/shift-head/<uuid:uuid>",
        SongQueueShiftHeadView.as_view(),
        name="song-queue-shift-head-to",
    ),
]
