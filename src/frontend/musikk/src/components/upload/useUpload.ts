import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createCollection, createSongs } from "./mutations";

type Status = { success?: boolean; uuid?: string; errorMsg?: string };

export function useUpload() {
    const [statuses, setStatuses] = useState<Record<number, Status>>({});
    const createSongsMutation = useMutation({
        mutationFn: createSongs,
    });
    const createCollectionMutation = useMutation({
        mutationFn: createCollection,
    });
    const changeSongStatuses = (idx: number, s: Status) => setStatuses((st) => ({ ...st, [idx]: s }));
    return { statuses, createSongsMutation, createCollectionMutation, changeSongStatuses };
}
