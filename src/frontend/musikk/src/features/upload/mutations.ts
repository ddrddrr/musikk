import { api_client } from "@/api/axiosConf.ts";
import { CollectionURLs, SongURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { Collection } from "@/features/collections/types.ts";

interface SongPayload {
    title: string;
    audio: File;
    description?: string;
    image?: File;
}

// TODO: add authors
export async function createSong(payload: SongPayload) {
    const formData = new FormData();

    formData.append("title", payload.title);
    formData.append("audio", payload.audio);

    if (payload.description) formData.append("description", payload.description);
    if (payload.image) formData.append("image", payload.image);

    const res = await api_client.post(SongURLs.songsCreate, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}

interface CreateCollectionInput {
    title: string;
    description?: string;
    image?: File;
    private: boolean;
    type: "album";
    authors: UUID[];
    songs: UUID[];
}
export async function createCollection(input: CreateCollectionInput): Promise<Collection> {
    const formData = new FormData();

    formData.append("title", input.title);
    formData.append("type", input.type);
    formData.append("private", String(input.private));

    if (input.description) formData.append("description", input.description);
    if (input.image) formData.append("image", input.image);

    input.authors.forEach((u) => formData.append("authors", String(u)));
    input.songs.forEach((u) => formData.append("songs", String(u)));

    const res = await api_client.post(CollectionURLs.collectionCreate, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data.collection;
}
