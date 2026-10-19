import { api_client } from "@/api/axiosConf.ts";
import { getErrorDetail } from "@/api/errorUtils.ts";
import { QueueURLs } from "@/features/song-queue/api/endpoints.ts";
import { queueKeys } from "@/features/song-queue/api/queryKeys.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

async function addSong(songUUID: string) {
    await api_client.post<void>(QueueURLs.addSong(songUUID));
}

async function addCollection(collectionUUID: string) {
    await api_client.post<void>(QueueURLs.addCollection(collectionUUID));
}

async function playSong(songUUID: string) {
    await api_client.post<void>(QueueURLs.playSong(songUUID));
}

async function playCollection(collectionUUID: string) {
    await api_client.post<void>(QueueURLs.playCollection(collectionUUID));
}

async function next() {
    await api_client.post<void>(QueueURLs.next);
}

async function skipTo(itemUUID: string) {
    await api_client.post<void>(QueueURLs.skipTo(itemUUID));
}

async function prev() {
    await api_client.post<void>(QueueURLs.prev);
}

async function removeItem(itemUUID: string) {
    await api_client.post<void>(QueueURLs.removeItem(itemUUID));
}

async function clearQueue() {
    await api_client.post<void>(QueueURLs.clearQueue);
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

export function useQueueSkipTo() {
    return useQueueMutation(skipTo, "Failed to play queue item");
}

export function useQueueRemoveItem() {
    return useQueueMutation(removeItem, "Failed to remove song from queue");
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
