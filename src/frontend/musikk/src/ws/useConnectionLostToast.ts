import { useWSClient } from "@/hooks/useWSClient.ts";
import { WSClient } from "@/ws/client.ts";
import { useEffect } from "react";
import { toast } from "sonner";

const CONNECTION_LOST_TOAST_ID = "ws-connection-lost";
// a tab that comes back from the background often reconnects at once,
// and the toast should not flash in that case
const CONNECTION_LOST_TOAST_DELAY_MS = 1000;

function showToastWhileConnectionIsLost(ws: WSClient): () => void {
    let toastTimeoutId: number | null = null;

    const clearToastTimeout = () => {
        if (toastTimeoutId === null) return;
        window.clearTimeout(toastTimeoutId);
        toastTimeoutId = null;
    };

    const unsubClose = ws.onClose(() => {
        if (toastTimeoutId !== null) return;
        toastTimeoutId = window.setTimeout(() => {
            toastTimeoutId = null;
            toast.warning("Connection lost. Reconnecting...", {
                id: CONNECTION_LOST_TOAST_ID,
                duration: Infinity,
            });
        }, CONNECTION_LOST_TOAST_DELAY_MS);
    });
    const unsubOpen = ws.onOpen(() => {
        clearToastTimeout();
        toast.dismiss(CONNECTION_LOST_TOAST_ID);
    });

    return () => {
        unsubClose();
        unsubOpen();
        clearToastTimeout();
        toast.dismiss(CONNECTION_LOST_TOAST_ID);
    };
}

// actions are dropped while the connection is down, so the user has to see that it is down
export function useConnectionLostToast() {
    const ws = useWSClient();
    useEffect(() => showToastWhileConnectionIsLost(ws), [ws]);
}
