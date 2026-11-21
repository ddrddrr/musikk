import { useWSClient } from "@/hooks/useWSClient.ts";
import { WSClient } from "@/ws/client.ts";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// the first open does nothing, because the queries have just loaded over HTTP
function refetchQueriesAfterReconnect(ws: WSClient, queryClient: QueryClient): () => void {
    let hasConnectionDropped = false;

    const unsubClose = ws.onClose(() => {
        hasConnectionDropped = true;
    });
    const unsubOpen = ws.onOpen(() => {
        if (!hasConnectionDropped) return;
        hasConnectionDropped = false;
        void queryClient.invalidateQueries();
    });

    return () => {
        unsubClose();
        unsubOpen();
    };
}

// the server does not replay the events that were sent while the connection was down,
// so the tab loads its data again. Only the queries on screen refetch, the others are only marked stale
export function useRefetchAfterReconnect() {
    const ws = useWSClient();
    const queryClient = useQueryClient();
    useEffect(() => refetchQueriesAfterReconnect(ws, queryClient), [ws, queryClient]);
}
