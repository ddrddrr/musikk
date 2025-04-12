# songs/*some filters* --> song list
# songs/uuid --> song data
# songs/uuid/mpd --> song mpd(for dash js)
# collections/*some filters* --> song list
# collections/uuid --> collection data

from django.urls import path

from streaming.api.v1.views import (
    SongCollectionListView,
    SongQueueAppendRandomView,
    SongQueueRetrieveView,
    SongCollectionDetailView,
    SongListCreateView,
)

urlpatterns = [
    path("songs/", SongListCreateView.as_view(), name="song-list-create"),
    path("collections/", SongCollectionListView.as_view(), name="collection-list"),
    path(
        "collections/<uuid:uuid>",
        SongCollectionDetailView.as_view(),
        name="collection-detail",
    ),
    path("song-queue/", SongQueueRetrieveView.as_view(), name="song-queue-retrieve"),
    path(
        "song-queue/append-random",
        SongQueueAppendRandomView.as_view(),
        name="song-queue-append-random",
    ),
]
