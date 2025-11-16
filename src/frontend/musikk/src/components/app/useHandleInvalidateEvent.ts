import { useWSClient } from "@/hooks/useWSClient.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useHandleInvalidateEvent() {
    const ws = useWSClient();
    const client = useQueryClient();

    useEffect(() => {
        ws.subscribe("invalidate.query", (payload) =>
            client.invalidateQueries({ queryKey: payload["query_key"] }),
        );
    }, [ws, client]);
}
