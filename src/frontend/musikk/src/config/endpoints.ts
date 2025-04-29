import { CommentObjectType } from "@/components/comments/types.ts";

const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api/v1";

export const SongURLs = {
    songList: `${BASE_URL}/songs`,
    songDetail: (songUUID: string) => `${BASE_URL}/songs/${songUUID}`,
    songsCreate: `${BASE_URL}/songs`,
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
    collectionDetail: (collectionUUID: string) => `${BASE_URL}/collections/${collectionUUID}`,
    collectionAddToLiked: (collectionUUID: string) => `${BASE_URL}/collections/${collectionUUID}/like`,
    collectionAddSong: (collectionUUID: string, songUUID: string) =>
        `${BASE_URL}/collections/${collectionUUID}/songs/${songUUID}`,
    collectionRemoveSong: (collectionUUID: string, songUUID: string) =>
        `${BASE_URL}/collections/${collectionUUID}/songs/${songUUID}`,
    likedSongsAddSong: (songUUID: string) => `${BASE_URL}/liked-songs/add-song/${songUUID}`,
};
export const CommentURLs = {
    commentList: (objType: CommentObjectType, objUUID: string) =>
        `${BASE_URL}/comments/?obj-type=${objType}&obj-uuid=${objUUID}`,
    commentCreate: `${BASE_URL}/comments/`,
};
export const NotificationURLs = {
    notificationsSetRead: `${BASE_URL}/notifications`,
    replyNotificationList: `${BASE_URL}/notifications/replies`,
};
export const UserURLs = {
    userDetail: (userUUID: string) => `${BASE_URL}/user/${userUUID}`,
    tokenGet: `${BASE_URL}/token/`,
    tokenRefresh: `${BASE_URL}/token/refresh/`,
};
export const SearchURLs = {
    searchMain: (query: string) => `${BASE_URL}/search?q=${query}`,
};
export const EventURLs = {
    userEvents: `${BASE_URL}/events/user`,
};
