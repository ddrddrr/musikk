const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api/v1";

export const SongURLs = {
    songList: `${BASE_URL}/songs`,
    songDetail: (songUUID: string) => `${BASE_URL}/songs/${songUUID}`,
    songUpload: `${BASE_URL}/songs`,
};
export const CollectionURLs = {
    collectionList: `${BASE_URL}/collections`,
    collectionDetailed: (collectionUUID: string) => `${BASE_URL}/collections/${collectionUUID}`,
};
export const UserUrls = {
    userDetailed: (userUUID: string) => `${BASE_URL}/users/${userUUID}`,
    tokenGet: `${BASE_URL}/token/`,
    tokenRefresh: `${BASE_URL}/token-refresh/`,
};
