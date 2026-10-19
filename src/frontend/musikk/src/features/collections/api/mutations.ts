import { api_client } from "@/api/axiosConf.ts";
import { getErrorDetail } from "@/api/errorUtils.ts";
import { UUID } from "@/api/types.ts";
import { CollectionURLs } from "@/features/collections/api/endpoints.ts";
import { collectionKeys } from "@/features/collections/api/queryKeys.ts";
import { Collection } from "@/features/collections/types.ts";
import { songKeys } from "@/features/songs/api/queryKeys.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ICollectionAddToLikedParams {
    collectionUUID: UUID;
}

async function collectionAddToLiked({
    collectionUUID,
}: ICollectionAddToLikedParams): Promise<void> {
    await api_client.post(CollectionURLs.collectionAddToLiked(collectionUUID));
}

async function collectionRemoveFromLiked({
    collectionUUID,
}: ICollectionAddToLikedParams): Promise<void> {
    await api_client.delete(CollectionURLs.collectionAddToLiked(collectionUUID));
}

export function useLikeCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: collectionAddToLiked,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userKeys.likedCollections() });
            toast.success("Added to liked collections");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to add collection to liked"));
        },
    });
}

export function useUnlikeCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: collectionRemoveFromLiked,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userKeys.likedCollections() });
            toast.success("Removed from liked collections");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to remove collection from liked"));
        },
    });
}

interface ICollectionDeleteParams {
    collectionUUID: UUID;
}

async function deleteCollection({ collectionUUID }: ICollectionDeleteParams): Promise<void> {
    await api_client.delete(CollectionURLs.collectionDelete(collectionUUID));
}

export function useDeleteCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCollection,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userKeys.libraries() });
            void queryClient.invalidateQueries({ queryKey: collectionKeys.details() });
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to delete playlist"));
        },
    });
}

interface ICollectionRemoveSongParams {
    collectionUUID: UUID;
    songCollectionSongUUID: UUID;
}

async function collectionRemoveSong({
    collectionUUID,
    songCollectionSongUUID,
}: ICollectionRemoveSongParams) {
    await api_client.delete(
        CollectionURLs.collectionRemoveSong(collectionUUID, songCollectionSongUUID),
    );
}

export function useRemoveSongFromCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: collectionRemoveSong,
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: collectionKeys.detail(variables.collectionUUID),
            });
            void queryClient.invalidateQueries({ queryKey: songKeys.collectionMemberships() });
            toast.success("Removed from playlist");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to remove song from playlist"));
        },
    });
}

export interface IAddToLikedSongsParams {
    collectionSongUUID: UUID;
}

async function addToLikedSongs({ collectionSongUUID }: IAddToLikedSongsParams) {
    await api_client.post(CollectionURLs.likedSongsAddSong(collectionSongUUID));
}

async function removeFromLikedSongs({ collectionSongUUID }: IAddToLikedSongsParams) {
    await api_client.delete(CollectionURLs.likedSongsAddSong(collectionSongUUID));
}

export function useLikeSong() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addToLikedSongs,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userKeys.likedSongs() });
            toast.success("Added to liked songs");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to like song"));
        },
    });
}

export function useUnlikeSong() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: removeFromLikedSongs,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userKeys.likedSongs() });
            toast.success("Removed from liked songs");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to remove from liked songs"));
        },
    });
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

async function createCollection(input: CreateCollectionInput): Promise<Collection> {
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

export function useCreateCollection() {
    return useMutation({
        mutationFn: createCollection,
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to create collection"));
        },
    });
}

export interface UpdateCollectionInput {
    title?: string;
    description?: string;
    image?: File;
    draft?: boolean;
}

interface UpdateCollectionParams {
    collectionUUID: UUID;
    input: UpdateCollectionInput;
}

async function updateCollection({
    collectionUUID,
    input,
}: UpdateCollectionParams): Promise<Collection> {
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

export function useUpdateCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCollection,
        onSuccess: (collection) => {
            void queryClient.invalidateQueries({
                queryKey: collectionKeys.detail(collection.uuid),
            });
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to update collection"));
        },
    });
}

interface CollectionSongPayload {
    collectionUUID: UUID;
    songUUID: UUID;
}

async function createCollectionSong(payload: CollectionSongPayload) {
    const formData = new FormData();
    formData.append("song_uuid", payload.songUUID);
    const res = await api_client.post<{ song_uuid: UUID; collection_song_uuid: UUID }>(
        CollectionURLs.collectionSongCreate(payload.collectionUUID),
        formData,
    );
    return res.data;
}

export function useAddSongToCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCollectionSong,
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: collectionKeys.detail(variables.collectionUUID),
            });
            void queryClient.invalidateQueries({ queryKey: songKeys.collectionMemberships() });
            toast.success("Added to playlist");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to add song to playlist"));
        },
    });
}
