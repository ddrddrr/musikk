import { api_client } from "@/api/axiosConf.ts";
import { UUID } from "@/api/types.ts";
import { CollectionURLs } from "@/features/collections/api/endpoints.ts";
import { Collection } from "@/features/collections/types.ts";

interface ICollectionAddToLikedParams {
    collectionUUID: UUID;
}

export async function collectionAddToLiked({
    collectionUUID,
}: ICollectionAddToLikedParams): Promise<void> {
    await api_client.post(CollectionURLs.collectionAddToLiked(collectionUUID));
}

export async function collectionRemoveFromLiked({
    collectionUUID,
}: ICollectionAddToLikedParams): Promise<void> {
    await api_client.delete(CollectionURLs.collectionAddToLiked(collectionUUID));
}

interface ICollectionDeleteParams {
    collectionUUID: UUID;
}

export async function deleteCollection({ collectionUUID }: ICollectionDeleteParams): Promise<void> {
    await api_client.delete(CollectionURLs.collectionDelete(collectionUUID));
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

export async function removeFromLikedSongs({ collectionSongUUID }: IAddToLikedSongsParams) {
    await api_client.delete(CollectionURLs.likedSongsAddSong(collectionSongUUID));
}

interface CreateCollectionInput {
    title: string;
    description?: string;
    image?: File;
    private: boolean;
    type: "album" | "playlist";
    authors?: UUID[];
    draft?: boolean;
}

export async function createCollection(input: CreateCollectionInput): Promise<Collection> {
    const formData = new FormData();

    formData.append("title", input.title);
    formData.append("type", input.type);
    formData.append("private", String(input.private));

    if (input.description) formData.append("description", input.description);
    if (input.image) formData.append("image", input.image);
    if (input.draft !== undefined) formData.append("draft", String(input.draft));

    input.authors?.forEach((u) => formData.append("authors", String(u)));

    const res = await api_client.post<Collection>(CollectionURLs.collectionCreate, formData);
    return res.data;
}

export interface UpdateCollectionInput {
    title?: string;
    description?: string;
    image?: File;
    draft?: boolean;
}

export async function updateCollection(
    collectionUUID: UUID,
    input: UpdateCollectionInput,
): Promise<Collection> {
    const formData = new FormData();

    if (input.title !== undefined) formData.append("title", input.title);
    if (input.description !== undefined) formData.append("description", input.description);
    if (input.image !== undefined) formData.append("image", input.image);
    if (input.draft !== undefined) formData.append("draft", String(input.draft));

    const res = await api_client.patch<Collection>(
        CollectionURLs.collectionDetail(collectionUUID),
        formData,
    );
    return res.data;
}

interface CollectionSongPayload {
    collectionUUID: UUID;
    songUUID: UUID;
}

export async function createCollectionSong(payload: CollectionSongPayload) {
    const formData = new FormData();
    formData.append("song_uuid", payload.songUUID);
    const res = await api_client.post<{ song_uuid: UUID; collection_song_uuid: UUID }>(
        CollectionURLs.collectionSongCreate(payload.collectionUUID),
        formData,
    );
    return res.data;
}
