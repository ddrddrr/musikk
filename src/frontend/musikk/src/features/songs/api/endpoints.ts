import { UUID } from "@/api/types.ts";

export const SongURLs = {
    albumBySong: (songUUID: UUID) => `/songs/${songUUID}/album`,
    collectionMemberships: (collectionSongUUID: UUID) => `/songs/${collectionSongUUID}/collections`,
};
