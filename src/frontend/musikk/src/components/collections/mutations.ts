import { api } from "@/config/axiosConf.ts";
import { CollectionURLs } from "@/config/endpoints.ts";

interface IAddToLikedSongsParams {
    songUUID: string;
}

export async function addToLikedSongs({ songUUID }: IAddToLikedSongsParams) {
    await api.post(CollectionURLs.likedSongsAddSong(songUUID));
}
