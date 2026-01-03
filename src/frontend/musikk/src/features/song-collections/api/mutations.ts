import { api_client } from "@/api/axiosConf.ts";
import { CollectionURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";

interface ICollectionAddSongParams {
    collectionUUID: UUID;
    songUUID: UUID;
}

export async function collectionAddSong({ collectionUUID, songUUID }: ICollectionAddSongParams) {
    await api_client.post(CollectionURLs.collectionAddSong(collectionUUID, songUUID));
}

interface ICollectionAddToLikedParams {
    collectionUUID: UUID;
}

export async function collectionAddToLiked({
    collectionUUID,
}: ICollectionAddToLikedParams): Promise<void> {
    await api_client.post(CollectionURLs.collectionAddToLiked(collectionUUID));
}

interface ICollectionRemoveSongParams {
    collectionUUID: UUID;
    songCollectionSongUUID: UUID;
}

export async function collectionRemoveSong({
    collectionUUID,
    songCollectionSongUUID,
}: ICollectionRemoveSongParams) {
    await api_client.delete(
        CollectionURLs.collectionRemoveSong(collectionUUID, songCollectionSongUUID),
    );
}

export interface IAddToLikedSongsParams {
    collectionSongUUID: UUID;
}

export async function addToLikedSongs({ collectionSongUUID }: IAddToLikedSongsParams) {
    await api_client.post(CollectionURLs.likedSongsAddSong(collectionSongUUID));
}
