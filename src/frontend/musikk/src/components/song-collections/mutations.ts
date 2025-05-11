import { api } from "@/config/axiosConf.ts";
import { CollectionURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";

interface ICollectionAddSongParams {
    collectionUUID: UUID;
    songUUID: UUID;
}

export async function collectionAddSong({ collectionUUID, songUUID }: ICollectionAddSongParams) {
    await api.post(CollectionURLs.collectionAddSong(collectionUUID, songUUID));
}

interface ICollectionAddToLikedParams {
    collectionUUID: UUID;
}

export async function collectionAddToLiked({ collectionUUID }: ICollectionAddToLikedParams): Promise<void> {
    await api.post(CollectionURLs.collectionAddToLiked(collectionUUID));
}

interface ICollectionRemoveSongParams {
    collectionUUID: UUID;
    songCollectionSongUUID: UUID;
}

export async function collectionRemoveSong({ collectionUUID, songCollectionSongUUID }: ICollectionRemoveSongParams) {
    await api.delete(CollectionURLs.collectionRemoveSong(collectionUUID, songCollectionSongUUID));
}

export interface IAddToLikedSongsParams {
    collectionSongUUID: UUID;
}

export async function addToLikedSongs({ collectionSongUUID }: IAddToLikedSongsParams) {
    await api.post(CollectionURLs.likedSongsAddSong(collectionSongUUID));
}
