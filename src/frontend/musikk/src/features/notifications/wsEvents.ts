import { notificationKeys } from "@/features/notifications/queryKeys.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useNotificationWsEvents() {
    const ws = useWSClient();
    const client = useQueryClient();

    useEffect(() => {
        return ws.subscribe("notifications.changed", () => {
            void client.invalidateQueries({ queryKey: notificationKeys.base });
        });
    }, [ws, client]);
}
