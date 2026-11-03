import { albumUploadKeys } from "@/features/album-upload/api/queryKeys.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// the track rows on the server are the only upload state, so an event only triggers a refetch.
// Events sent while the connection was down are lost, so every new connection refetches too
export function useAlbumUploadWsEvents() {
    const ws = useWSClient();
    const client = useQueryClient();

    useEffect(() => {
        const refetchTracks = () => {
            void client.invalidateQueries({ queryKey: albumUploadKeys.base });
        };
        const unsubUpload = ws.subscribe("song.upload", refetchTracks);
        const unsubOpen = ws.onOpen(refetchTracks);

        return () => {
            unsubUpload();
            unsubOpen();
        };
    }, [ws, client]);
}
