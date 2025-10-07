import { ISongCollection } from "@/components/song-collections/types.ts";
import { api } from "@/config/axiosConf.ts";
import { CollectionURLs, SongURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";

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

    const res = await api.post(SongURLs.songsCreate, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}

export async function createCollection(payload: {
    title: string;
    description?: string;
    private: boolean;
    image?: File;
    authors?: UUID[];
    songs: string[];
}): Promise<ISongCollection> {
    const formData = new FormData();

    formData.append("title", payload.title);
    formData.append("private", String(payload.private));
    formData.append("type", "album");
    payload.songs.forEach((uuid) => formData.append("songs", uuid));

    if (payload.description) formData.append("description", payload.description);
    if (payload.image) formData.append("image", payload.image);
    if (payload.authors) payload.authors.forEach((a) => formData.append("authors", a));

    const res = await api.post(CollectionURLs.collectionCreate, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.collection;
}
