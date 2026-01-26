import { api_client } from "@/api/axiosConf.ts";
import { UUID } from "@/api/types.ts";
import { CollectionURLs } from "@/features/collections/api/endpoints.ts";

interface CollectionSongPayload {
    // TODO: playlist/album song creation views
    operationID: UUID;
    collectionUUID: UUID;
    songUUID?: UUID;
    title?: string;
    audio?: File;
    image?: File;
}

export async function createCollectionSong(payload: CollectionSongPayload) {
    const formData = new FormData();

    if (!payload?.songUUID && !(payload?.operationID && payload?.audio && payload?.title)) {
        throw new Error(
            "Neither and existing song provided, nor parameters required to create a new one.",
        );
    }

    if (payload?.operationID) {
        formData.append("operation_id", payload.operationID);
    }
    if (payload?.songUUID) {
        formData.append("song_uuid", payload.songUUID);
    }
    if (payload?.title) {
        formData.append("title", payload.title);
    }
    if (payload?.audio) {
        formData.append("audio", payload.audio);
    }
    if (payload.image) {
        formData.append("image", payload.image);
    }

    const res = await api_client.post<{ song_uuid: UUID; collection_song_uuid: UUID }>(
        CollectionURLs.collectionSongCreate(payload.collectionUUID),
        formData,
    );
    return res.data;
}
