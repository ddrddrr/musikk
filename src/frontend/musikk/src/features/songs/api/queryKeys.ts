import { UUID } from "@/api/types.ts";

export const songKeys = {
    base: ["songs"] as const,
    collectionMemberships: () => [...songKeys.base, "collection-memberships"] as const,
    collectionMembership: (collectionSongUUID: UUID) =>
        [...songKeys.collectionMemberships(), collectionSongUUID] as const,
};
