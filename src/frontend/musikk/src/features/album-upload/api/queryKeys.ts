import { UUID } from "@/api/types.ts";

export const albumUploadKeys = {
    base: ["album-upload"] as const,
    tracks: (albumUUID: UUID) => [...albumUploadKeys.base, "tracks", albumUUID] as const,
    uploads: (albumUUID: UUID) => [...albumUploadKeys.base, "uploads", albumUUID] as const,
};
