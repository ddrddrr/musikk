import { queueKeys } from "@/features/song-queue/queryKeys.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useQueueWsEvents() {
    const ws = useWSClient();
    const client = useQueryClient();

    useEffect(() => {
        return ws.subscribe("queue.changed", () => {
            void client.invalidateQueries({ queryKey: queueKeys.base });
        });
    }, [ws, client]);
}
