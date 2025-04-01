# songs/*some filters* --> song list
# songs/uuid --> song data
# songs/uuid/mpd --> song mpd(for dash js)
# collections/*some filters* --> song list
# collections/uuid --> collection data

from django.urls import path

from streaming.api.v1.views import (
    SongListView,
    SongCollectionListView,
    SongQueueAppendRandomView,
    SongQueueRetrieveView,
)

urlpatterns = [
    path("songs/", SongListView.as_view(), name="song-list"),
    path("collections/", SongCollectionListView.as_view(), name="collection-list"),
    path("song-queue/", SongQueueRetrieveView.as_view(), name="song-queue-retrieve"),
    path(
        "song-queue/append-random",
        SongQueueAppendRandomView.as_view(),
        name="song-queue-append-random",
    ),
]
