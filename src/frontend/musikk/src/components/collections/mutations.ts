import { api } from "@/config/axiosConf.ts";
import { CollectionURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";

interface IAddToLikedSongsParams {
    collectionSongUUID: UUID;
}

export async function addToLikedSongs({ collectionSongUUID }: IAddToLikedSongsParams) {
    await api.post(CollectionURLs.likedSongsAddSong(collectionSongUUID));
}
