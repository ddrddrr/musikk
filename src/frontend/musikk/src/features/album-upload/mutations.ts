import { api_client } from "@/api/axiosConf.ts";
import { UUID } from "@/api/types.ts";
import { CollectionURLs } from "@/features/collections/api/endpoints.ts";

interface CollectionSongPayload {
    // TODO: playlist/album song creation views
    operationID: UUID;
    collectionUUID: UUID;
    title: string;
    audio: File;
    image?: File;
}

export async function uploadCollectionSong(payload: CollectionSongPayload) {
    const formData = new FormData();

    if (!(payload?.operationID && payload?.audio && payload?.title)) {
        throw new Error(
            "`operationID`, `audio` and `title` are required for CollectionSong upload operation",
        );
    }

    formData.append("operation_id", payload.operationID);
    formData.append("title", payload.title);
    formData.append("audio", payload.audio);
    if (payload.image) {
        formData.append("image", payload.image);
    }

    const res = await api_client.post<{ song_uuid: UUID; collection_song_uuid: UUID }>(
        CollectionURLs.collectionSongCreate(payload.collectionUUID),
        formData,
    );
    return res.data;
}
