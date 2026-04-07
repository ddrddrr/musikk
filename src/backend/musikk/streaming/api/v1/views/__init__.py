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
    PlayerMixin,
    PlayerStateRetrieveView,
    QueueAddSongView,
    QueueAddCollectionView,
    PlayerPlaySongView,
    PlayerPlayCollectionView,
    QueueAppendRandomSongsView,
    QueueRemoveItemView,
    PlayerClearView,
    PlayerNextView,
    PlayerPrevView,
    QueueReorderView,
    MoveContextToQueueView,
)
from streaming.api.v1.views.songs import (
    CollectionSongRetrieveView,
    SongAddLikedView,
)
