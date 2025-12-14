import type { Collection, CollectionSong } from "@/modules/song-collections/types.ts";
import { getSongQueue } from "@/modules/song-queue/api/queries.ts";
import { ISongQueue } from "@/modules/song-queue/api/types.ts";
import {
    addCollection,
    addSong,
    clearQueue,
    setHeadCollection,
    setHeadSong,
    shiftHead,
    shiftHeadBackwards,
} from "@/modules/song-queue/mutations.ts";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useQueue() {
    return useQuery<ISongQueue>({
        queryKey: ["queue"],
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
    });
}
