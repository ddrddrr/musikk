import { WebsocketURLs } from "@/api/endpoints.ts";
import { WSContext } from "@/providers/websocketContext.ts";
import WebSocketManager from "@/ws/manager";
import { ReactNode, useEffect, useState } from "react";

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const [client] = useState(() => WebSocketManager.connect(WebsocketURLs.userChannel));

    useEffect(() => {
        return () => {
            WebSocketManager.disconnect();
        };
    }, []);

    return <WSContext value={client}>{children}</WSContext>;
}
