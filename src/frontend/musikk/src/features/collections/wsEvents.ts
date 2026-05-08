import { useWSClient } from "@/hooks/useWSClient.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useCollectionWsEvents() {
    const ws = useWSClient();
    const client = useQueryClient();

    useEffect(() => {
        const unsubCollection = ws.subscribe("collection.changed", () => {
            void client.invalidateQueries({ queryKey: ["openCollection"] });
        });

        return () => {
            unsubCollection();
        };
    }, [ws, client]);
}
