import { UUID } from "@/api/types.ts";

export const songKeys = {
    userCollectionsBase: ["songUserCollections"] as const,
    userCollections: (collectionSongUUID: UUID) =>
        [...songKeys.userCollectionsBase, collectionSongUUID] as const,
};
