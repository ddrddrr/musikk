const BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/v1';

export const SongURLs = {
    songList: `${BASE_URL}/songs`,
    songDetail: (songUUID: string) => `${BASE_URL}/songs/${songUUID}`,
};
export const CollectionURLs = {
    collectionList: `${BASE_URL}/collections`,
    collectionDetailed: (collectionUUID: string) => `${BASE_URL}/collections/${collectionUUID}`,
};