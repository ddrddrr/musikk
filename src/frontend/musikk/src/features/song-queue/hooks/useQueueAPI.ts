import { getErrorDetail } from "@/api/errorUtils.ts";
import { getSongQueue } from "@/features/song-queue/api/queries.ts";
import { SongQueue } from "@/features/song-queue/api/types.ts";
import {
    addCollection,
    addSong,
    clearQueue,
    next,
    playCollection,
    playSong,
    prev,
} from "@/features/song-queue/mutations.ts";
import { queueKeys } from "@/features/song-queue/queryKeys.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useQueue() {
    return useQuery<SongQueue>({
        queryKey: queueKeys.base,
        queryFn: getSongQueue,
    });
}

function useQueueMutation<TVariables = void>(
    mutationFn: (variables: TVariables) => Promise<void>,
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
