from streaming.api.v1.views.collections import (
    CollectionListCreateView,
    CollectionPersonalView,
    CollectionRetrieveView,
    CollectionDetailView,
    CollectionAddLikedView,
    CollectionRemoveSong,
    CollectionSongCreateView,
    AlbumBySongView,
)

from streaming.api.v1.views.connections import (
    FriendsLatestListenedView,
)
from streaming.api.v1.views.song_queue import (
    SongQueueMixin,
    SongQueueRetrieveView,
    SongQueueAddSongView,
    SongQueueAddCollectionView,
    SongQueuePlaySongView,
    SongQueuePlayCollectionView,
    SongQueueAppendRandomSongsView,
    SongQueueRemoveItemView,
    SongQueueClearView,
    SongQueueNextView,
    SongQueuePrevView,
)
from streaming.api.v1.views.songs import (
    CollectionSongRetrieveView,
    SongAddLikedView,
)
