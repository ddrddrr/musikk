import { UUID } from "@/api/types.ts";
import { SongUploadStatus } from "@/features/upload/types.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
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
