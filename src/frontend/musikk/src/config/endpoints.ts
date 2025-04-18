const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api/v1";

export const SongURLs = {
    songList: `${BASE_URL}/songs`,
    songDetail: (songUUID: string) => `${BASE_URL}/songs/${songUUID}`,
    songUpload: `${BASE_URL}/songs`,
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
    collectionList: `${BASE_URL}/collections`,
    collectionDetail: (collectionUUID: string) => `${BASE_URL}/collections/${collectionUUID}`,
};
export const UserUrls = {
    userDetail: (userUUID: string) => `${BASE_URL}/users/${userUUID}`,
    tokenGet: `${BASE_URL}/token/`,
    tokenRefresh: `${BASE_URL}/token/refresh/`,
};
