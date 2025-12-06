from streaming.api.v1.views.collections import (
    PlaylistsLatestView,
    CollectionPersonalView,
    CollectionRetrieveView,
    CollectionDetailView,
    CollectionAddLikedView,
    CollectionRemoveSong,
    CollectionAddSong,
    CollectionCreateView,
    AlbumBySongView,
)
from streaming.api.v1.views.connections import (
    FriendsLatestListenedView,
    FriendsLatestAddedCollectionsView
)
from streaming.api.v1.views.playback import (
    PlaybackDeviceView,
    PlaybackDeviceActivateView,
    # PlaybackDeviceDeleteView,
    PlaybackStateView,
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
    SongCreateView,
)
