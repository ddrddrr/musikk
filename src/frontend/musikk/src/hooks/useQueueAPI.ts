import type { ISongCollection } from "@/components/song-collection/types.ts";
import {
    addCollection,
    addSong,
    clearQueue,
    setHeadCollection,
    setHeadSong,
    shiftHead,
    shiftHeadBackwards,
} from "@/components/song-queue/mutations.ts";
import { getSongQueue } from "@/components/song-queue/queries.ts";
import type { ISong } from "@/components/song/types.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useQueue() {
    const { isPending, error, data, isFetching } = useQuery({
        queryKey: ["queue"],
        queryFn: getSongQueue,
    });
    const queue = data;
    return { isPending, error, queue, isFetching };
}

function useQueueMutationHandlers() {
    const queryClient = useQueryClient();

    const onSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["queue"] });
    };

    const onError = (err: unknown) => {
        console.error("Mutation error", err);
    };

    return { onSuccess, onError };
}

// typescript doesn't allow for interface type matching
// rewrite and improve somehow...
type AddSongAction = {
    type: "song";
    action: "add" | "setHead";
    item: ISong;
};
type AddCollectionAction = {
    type: "collection";
    action: "add" | "setHead";
    item: ISongCollection;
};
type QueueAddInput = AddSongAction | AddCollectionAction;

export function useQueueAddAPI() {
    // const { onSuccess, onError } = useQueueMutationHandlers();

    function handleQueueAddAction(input: QueueAddInput): Promise<unknown> {
        switch (input.type) {
            case "song":
                return input.action === "add" ? addSong(input.item.uuid) : setHeadSong(input.item.uuid);
            case "collection":
                return input.action === "add" ? addCollection(input.item.uuid) : setHeadCollection(input.item.uuid);
            default:
                return Promise.reject(new Error("Invalid action"));
        }
    }

    return useMutation<unknown, Error, QueueAddInput>({
        mutationFn: handleQueueAddAction,
        // onSuccess,
        // onError,
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
    // const { onSuccess, onError } = useQueueMutationHandlers();

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
        // onSuccess,
        // onError,
    });
}
