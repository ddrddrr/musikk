import { api_client } from "@/api/axiosConf.ts";
import { getErrorDetail } from "@/api/errorUtils.ts";
import { QueueURLs } from "@/features/song-queue/api/endpoints.ts";
import { queueKeys } from "@/features/song-queue/api/queryKeys.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

async function addSong(songUUID: string) {
    await api_client.post(QueueURLs.addSong(songUUID));
}

async function addCollection(collectionUUID: string) {
    await api_client.post(QueueURLs.addCollection(collectionUUID));
}

async function playSong(songUUID: string) {
    await api_client.post(QueueURLs.playSong(songUUID));
}

async function playCollection(collectionUUID: string) {
    await api_client.post(QueueURLs.playCollection(collectionUUID));
}

async function next() {
    await api_client.post(QueueURLs.next);
}

export async function skipTo(itemUUID: string) {
    await api_client.post(QueueURLs.skipTo(itemUUID));
}

async function prev() {
    await api_client.post(QueueURLs.prev);
}

export async function removeItem(itemUUID: string) {
    await api_client.post(QueueURLs.removeItem(itemUUID));
}

async function clearQueue() {
    await api_client.post(QueueURLs.clearQueue);
}

function useQueueMutation<T = void>(
    mutationFn: (variables: T) => Promise<void>,
    errorMessage: string,
) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queueKeys.base });
        },
        onError: (error: Error) => {
            toast.error(getErrorDetail(error, errorMessage));
        },
    });
}

export function useQueueNext() {
    return useQueueMutation(next, "Failed to skip to next");
}

export function useQueuePrev() {
    return useQueueMutation(prev, "Failed to go to previous");
}

export function useQueueClear() {
    return useQueueMutation(clearQueue, "Failed to clear queue");
}

export function useAddSong() {
    return useQueueMutation(addSong, "Failed to add song to queue");
}

export function usePlaySong() {
    return useQueueMutation(playSong, "Failed to play song");
}

export function useAddCollection() {
    return useQueueMutation(addCollection, "Failed to add collection to queue");
}

export function usePlayCollection() {
    return useQueueMutation(playCollection, "Failed to play collection");
}
