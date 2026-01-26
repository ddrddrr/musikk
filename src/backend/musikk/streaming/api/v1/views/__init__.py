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
    SongQueueBaseView,
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
from streaming.api.v1.views.songs import (
    CollectionSongRetrieveView,
    SongAddLikedView,
)
