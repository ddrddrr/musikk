import { UUID } from "@/api/types.ts";

export const songKeys = {
    userCollections: (collectionSongUUID: UUID) =>
        ["songUserCollections", collectionSongUUID] as const,
};
