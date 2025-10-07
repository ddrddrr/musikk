import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useHandleInvalidateEvent() {
    const client = useQueryClient();

    return useCallback(
        function handleEvent(event: MessageEvent) {
            const data: [any] = JSON.parse(event.data);
            if (data) {
                client.invalidateQueries({ queryKey: data });
            }
        },
        [client],
    );
}
