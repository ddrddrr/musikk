import { UUID } from "@/api/types.ts";

export const CollectionURLs = {
    collectionCreate: `/collections`,
    collectionList: `/collections`,
    collectionPersonal: (userUUID: UUID) => `/collections/personal/${userUUID}`,
    collectionRetrieve: (collectionUUID: UUID) => `/collections/${collectionUUID}`,
    collectionDetail: (collectionUUID: UUID) => `/collections/detail/${collectionUUID}`,
    collectionAddToLiked: (collectionUUID: UUID) => `/collections/${collectionUUID}/like`,
    collectionSongCreate: (collectionUUID: UUID) => `/collections/${collectionUUID}/songs`,
    collectionRemoveSong: (collectionUUID: UUID, songCollectionSongUUID: UUID) =>
        `/collections/${collectionUUID}/songs/${songCollectionSongUUID}/remove`,
    // TODO: not needed, generic collectionSongCreate is enough
    likedSongsAddSong: (songUUID: UUID) => `/liked-songs/add-song/${songUUID}`,
};
