import { albumUploadKeys } from "@/features/album-upload/api/queryKeys.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// the track rows on the server are the only upload state, so an event only triggers a refetch
export function useAlbumUploadWsEvents() {
    const ws = useWSClient();
    const client = useQueryClient();

    useEffect(() => {
        return ws.subscribe("song.upload", () => {
            void client.invalidateQueries({ queryKey: albumUploadKeys.base });
        });
    }, [ws, client]);
}
