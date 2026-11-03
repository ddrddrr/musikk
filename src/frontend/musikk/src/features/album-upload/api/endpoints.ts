import { UUID } from "@/api/types.ts";

export const AlbumUploadURLs = {
    tracks: (albumUUID: UUID) => `/collections/${albumUUID}/songs`,
};
