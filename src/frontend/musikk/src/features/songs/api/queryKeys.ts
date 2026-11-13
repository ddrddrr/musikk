import { UUID } from "@/api/types.ts";

export const songKeys = {
    base: ["songs"] as const,
    albumBySong: (songUUID: UUID) => [...songKeys.base, "album-by-song", songUUID] as const,
    collectionMemberships: () => [...songKeys.base, "collection-memberships"] as const,
    collectionMembership: (collectionSongUUID: UUID) =>
        [...songKeys.collectionMemberships(), collectionSongUUID] as const,
};
