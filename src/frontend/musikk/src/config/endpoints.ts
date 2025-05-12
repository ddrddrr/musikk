import { PublicationObjectType } from "@/components/publications/types.ts";
import { UUID } from "@/config/types.ts";

const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api/v1";

export const SongURLs = {
    songList: `${BASE_URL}/songs`,
    songsCreate: `${BASE_URL}/songs`,
    songRetrieve: (songUUID: UUID) => `${BASE_URL}/songs/${songUUID}`,
};
export const QueueURLs = {
    queue: `${BASE_URL}/song-queue`,
    addSong: (songUUID: string) => `${BASE_URL}/song-queue/add-song/${songUUID}`,
    addCollection: (collectionUUID: string) => `${BASE_URL}/song-queue/add-collection/${collectionUUID}`,
    setHeadSong: (songUUID: string) => `${BASE_URL}/song-queue/set-head-song/${songUUID}`,
    setHeadCollection: (songUUID: string) => `${BASE_URL}/song-queue/set-head-collection/${songUUID}`,
    shiftHead: `${BASE_URL}/song-queue/shift-head`,
    shiftHeadTo: (nodeUUID: string) => `${BASE_URL}/song-queue/shift-head/${nodeUUID}`,
    shiftHeadBackwards: `${BASE_URL}/song-queue/shift-head-backwards`,
    removeNode: (nodeUUID: string) => `${BASE_URL}/song-queue/remove-node/${nodeUUID}`,
    clearQueue: `${BASE_URL}/song-queue/clear`,
    appendRandom: `${BASE_URL}/song-queue/append-random`,
};
export const CollectionURLs = {
    collectionCreate: `${BASE_URL}/collections`,
    collectionLatest: `${BASE_URL}/collections/latest`,
    collectionPersonal: `${BASE_URL}/collections/personal`,
    collectionRetrieve: (collectionUUID: string) => `${BASE_URL}/collections/${collectionUUID}`,
    collectionDetail: (collectionUUID: string) => `${BASE_URL}/collections/detail/${collectionUUID}`,
    collectionAddToLiked: (collectionUUID: string) => `${BASE_URL}/collections/${collectionUUID}/like`,
    collectionAddSong: (collectionUUID: string, songUUID: string) =>
        `${BASE_URL}/collections/${collectionUUID}/songs/${songUUID}`,
    collectionRemoveSong: (collectionUUID: string, songCollectionSongUUID: string) =>
        `${BASE_URL}/collections/${collectionUUID}/songs/${songCollectionSongUUID}`,
    likedSongsAddSong: (songUUID: string) => `${BASE_URL}/liked-songs/add-song/${songUUID}`,
};
export const CommentURLs = {
    commentList: (objType: PublicationObjectType, objUUID: string) => `${BASE_URL}/comments/${objType}/${objUUID}`,
    commentCreate: (objType: PublicationObjectType, objUUID: string) => `${BASE_URL}/comments/${objType}/${objUUID}`,
};
export const PostURLs = {
    userPostCreate: (userUUID: string) => `${BASE_URL}/posts/users/${userUUID}`,
    userPostList: (userUUID: string) => `${BASE_URL}/posts/users/${userUUID}`,
};
export const NotificationURLs = {
    notificationsSetRead: `${BASE_URL}/notifications`,
    notificationsList: `${BASE_URL}/notifications`,
    friendRequestCreate: (receiverUUID: string) => `${BASE_URL}/notifications/friend-requests/${receiverUUID}`,
    notificationsDelete: (notificationUUID: string) => `${BASE_URL}/notifications/${notificationUUID}`,
};
export const UserURLs = {
    userDetail: (userUUID: string) => `${BASE_URL}/users/${userUUID}`,
    userCreate: `${BASE_URL}/users`,
    userFriends: `${BASE_URL}/users/friends`,
    userFriendsAccept: (senderUUID: string) => `${BASE_URL}/users/friends/${senderUUID}`,
    userUpdate: (userUUID: string) => `${BASE_URL}/users/${userUUID}`,
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
    activate: `${BASE_URL}/playback/activate`,
    stop: `${BASE_URL}/playback/stop`,
    registerDevice: `${BASE_URL}/playback-device`,
};
