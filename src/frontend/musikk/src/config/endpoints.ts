import { PublicationObjectType } from "@/components/publications/types.ts";
import { UUID } from "@/config/types.ts";

const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api/v1";

export const SongURLs = {
    songList: `${BASE_URL}/songs`,
    songsCreate: `${BASE_URL}/songs`,
    songRetrieve: (songUUID: UUID) => `${BASE_URL}/songs/${songUUID}`,
    albumBySong: (songUUID: UUID) => `${BASE_URL}/songs/${songUUID}/album`,
};
export const QueueURLs = {
    queue: `${BASE_URL}/song-queue`,
    addSong: (songUUID: UUID) => `${BASE_URL}/song-queue/add-song/${songUUID}`,
    addCollection: (collectionUUID: UUID) => `${BASE_URL}/song-queue/add-collection/${collectionUUID}`,
    setHeadSong: (songUUID: UUID) => `${BASE_URL}/song-queue/set-head-song/${songUUID}`,
    setHeadCollection: (songUUID: UUID) => `${BASE_URL}/song-queue/set-head-collection/${songUUID}`,
    shiftHead: `${BASE_URL}/song-queue/shift-head`,
    shiftHeadTo: (nodeUUID: UUID) => `${BASE_URL}/song-queue/shift-head/${nodeUUID}`,
    shiftHeadBackwards: `${BASE_URL}/song-queue/shift-head-backwards`,
    removeNode: (nodeUUID: UUID) => `${BASE_URL}/song-queue/remove-node/${nodeUUID}`,
    clearQueue: `${BASE_URL}/song-queue/clear`,
    appendRandom: `${BASE_URL}/song-queue/append-random`,
};
export const CollectionURLs = {
    collectionCreate: `${BASE_URL}/collections`,
    collectionLatest: `${BASE_URL}/collections/latest`,
    collectionPersonal: (userUUID: UUID) => `${BASE_URL}/collections/personal/${userUUID}`,
    collectionRetrieve: (collectionUUID: UUID) => `${BASE_URL}/collections/${collectionUUID}`,
    collectionDetail: (collectionUUID: UUID) => `${BASE_URL}/collections/detail/${collectionUUID}`,
    collectionAddToLiked: (collectionUUID: UUID) => `${BASE_URL}/collections/${collectionUUID}/like`,
    collectionAddSong: (collectionUUID: UUID, songUUID: UUID) =>
        `${BASE_URL}/collections/${collectionUUID}/songs/${songUUID}`,
    collectionRemoveSong: (collectionUUID: UUID, songCollectionSongUUID: UUID) =>
        `${BASE_URL}/collections/${collectionUUID}/songs/${songCollectionSongUUID}`,
    likedSongsAddSong: (songUUID: UUID) => `${BASE_URL}/liked-songs/add-song/${songUUID}`,
};
export const CommentURLs = {
    commentList: (objType: PublicationObjectType, objUUID: UUID) => `${BASE_URL}/comments/${objType}/${objUUID}`,
    commentCreate: (objType: PublicationObjectType, objUUID: UUID) => `${BASE_URL}/comments/${objType}/${objUUID}`,
};
export const PostURLs = {
    postCreate: `${BASE_URL}/posts`,
    userPostList: (userUUID: UUID) => `${BASE_URL}/posts/users/${userUUID}`,
    postRetrieve: (postUUID: UUID) => `${BASE_URL}/posts/${postUUID}`,
    postChildrenList: (postUUID: UUID) => `${BASE_URL}/posts/${postUUID}/children`,
    postLatestList: `${BASE_URL}/posts/latest`,
};
export const NotificationURLs = {
    notificationsSetRead: `${BASE_URL}/notifications`,
    notificationsList: `${BASE_URL}/notifications`,
    friendRequestCreate: (receiverUUID: UUID) => `${BASE_URL}/notifications/friend-requests/${receiverUUID}`,
    notificationsDelete: (notificationUUID: UUID) => `${BASE_URL}/notifications/${notificationUUID}`,
};
export const UserURLs = {
    userDetail: (userUUID: UUID) => `${BASE_URL}/users/${userUUID}`,
    userCreate: `${BASE_URL}/users`,
    userFriends: (userUUID: UUID) => `${BASE_URL}/users/${userUUID}/friends`,
    userFollowed: (userUUID: UUID) => `${BASE_URL}/users/${userUUID}/followed`,
    userFriendsAccept: (userUUID: UUID, senderUUID: UUID) => `${BASE_URL}/users/${userUUID}/friends/${senderUUID}`,
    userFriendsDelete: (userUUID: UUID, senderUUID: UUID) => `${BASE_URL}/users/${userUUID}/friends/${senderUUID}`,
    userUpdate: (userUUID: UUID) => `${BASE_URL}/users/${userUUID}`,
    artistFollowersList: (artistUUID: UUID) => `${BASE_URL}/users/artists/${artistUUID}/followers`,
    followArtist: (artistUUID: UUID) => `${BASE_URL}/users/artists/${artistUUID}/followers`,
    removeFollowedArtist: (artistUUID: UUID) => `${BASE_URL}/users/artists/${artistUUID}/followers`,
    tokenGet: `${BASE_URL}/token/`,
    tokenRefresh: `${BASE_URL}/token/refresh/`,
};
export const SearchURLs = {
    searchMain: (query: string) => `${BASE_URL}/search?q=${query}`,
};
export const EventURLs = {
    userEvents: `${BASE_URL}/events/user`,
};
export const PlaybackURLs = {
    retrieve: `${BASE_URL}/playback`,
    setState: `${BASE_URL}/playback`,
    registerDevice: `${BASE_URL}/playback-device`,
    deleteDevice: (deviceUUID: UUID) => `${BASE_URL}/playback-device/${deviceUUID}/delete`,
    setDeviceActive: (deviceUUID: UUID) => `${BASE_URL}/playback-device/${deviceUUID}/activate`,
};
export const FriendActivityURLs = {
    listeningToList: `${BASE_URL}/friend-activity/active-songs`,
    latestAddedList: `${BASE_URL}/friend-activity/latest-added`,
};
