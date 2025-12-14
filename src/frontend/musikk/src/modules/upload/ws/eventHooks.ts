import { UUID } from "@/api/types.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { SongUploadStatus } from "@/modules/upload/types.ts";
import { useEffect } from "react";

export interface UploadEventPayload {
    uuid: UUID;
    status: SongUploadStatus;
    detail?: string;
}

export function useSongUploadEvent(onEvent: (p: UploadEventPayload) => void) {
    const ws = useWSClient();

    useEffect(() => {
        return ws.subscribe("song.upload", (payload: UploadEventPayload) => onEvent(payload));
    }, [ws, onEvent]);
}

export type CreateState = Record<string, { status: SongUploadStatus; detail?: string }>;
export type StatusByUUId = Record<UUID, UploadEventPayload>;
