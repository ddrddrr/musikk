import { WebsocketURLs } from "@/api/endpoints.ts";
import { WSContext } from "@/providers/websocketContext.ts";
import WebSocketManager from "@/ws/manager";
import { ReactNode, useEffect, useState } from "react";

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const [client] = useState(() => WebSocketManager.connect(WebsocketURLs.userChannel));

    useEffect(() => {
        const onOnline = () => client.reconnect();
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                client.reconnect();
            }
        };

        window.addEventListener("online", onOnline);
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            window.removeEventListener("online", onOnline);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [client]);

    useEffect(() => {
        return () => {
            WebSocketManager.disconnect();
        };
    }, []);

    return <WSContext value={client}>{children}</WSContext>;
}
