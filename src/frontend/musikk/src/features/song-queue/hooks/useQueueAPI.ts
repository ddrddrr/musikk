import { getErrorDetail } from "@/api/errorUtils.ts";
import type { Collection, CollectionSong } from "@/features/collections/types.ts";
import { getSongQueue } from "@/features/song-queue/api/queries.ts";
import { SongQueue } from "@/features/song-queue/api/types.ts";
import {
    addCollection,
    addSong,
    clearQueue,
    setHeadCollection,
    setHeadSong,
    shiftHead,
    shiftHeadBackwards,
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

// typescript doesn't allow for interface type matching
// rewrite and improve somehow...
type AddSongAction = {
    type: "song";
    action: "add" | "setHead";
    item: CollectionSong;
};
type AddCollectionAction = {
    type: "collection";
    action: "add" | "setHead";
    item: Collection;
};
type QueueAddInput = AddSongAction | AddCollectionAction;

export function useQueueAddAPI() {
    const queryClient = useQueryClient();

    function handleQueueAddAction(input: QueueAddInput): Promise<unknown> {
        switch (input.type) {
            case "song":
                return input.action === "add"
                    ? addSong(input.item.uuid)
                    : setHeadSong(input.item.uuid);
            case "collection":
                return input.action === "add"
                    ? addCollection(input.item.uuid)
                    : setHeadCollection(input.item.uuid);
            default:
                return Promise.reject(new Error("Invalid action"));
        }
    }

    return useMutation({
        mutationFn: (input: QueueAddInput) => handleQueueAddAction(input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queueKeys.base });
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to add to queue"));
        },
    });
}

type ClearQueueAction = {
    action: "clear";
};
type ShiftHeadQueueAction = {
    action: "shift";
};
type ShiftHeadBackQueueAction = {
    action: "shift-back";
};

type QueueChangeInput = ClearQueueAction | ShiftHeadQueueAction | ShiftHeadBackQueueAction;

export function useQueueChangeAPI() {
    const queryClient = useQueryClient();

    function handleQueueChangeAction(input: QueueChangeInput): Promise<unknown> {
        switch (input.action) {
            case "clear":
                return clearQueue();
            case "shift":
                return shiftHead();
            case "shift-back":
                return shiftHeadBackwards();
            default:
                return Promise.reject(new Error("Invalid action"));
        }
    }

    return useMutation<unknown, Error, QueueChangeInput>({
        mutationFn: handleQueueChangeAction,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queueKeys.base });
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to update queue"));
        },
    });
}
