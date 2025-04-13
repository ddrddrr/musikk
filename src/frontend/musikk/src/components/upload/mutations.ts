import { api } from "@/config/axiosConf.ts";
import { SongURLs } from "@/config/endpoints.ts";

export interface ISongUpload {
    title: string;
    audio: File;
    description?: string;
    image?: File;
}

export async function uploadSong(song: ISongUpload) {
    const formData = new FormData();

    formData.append("title", song.title);
    formData.append("audio", song.audio);
    if (song.description) {
        formData.append("description", song.description);
    }
    if (song.image) {
        formData.append("image", song.image);
    }

    const response = await api.post(SongURLs.songUpload, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
}
