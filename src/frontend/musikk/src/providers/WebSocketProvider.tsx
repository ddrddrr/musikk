import { WebsocketURLs } from "@/api/endpoints.ts";
import { WSContext } from "@/providers/websocketContext.ts";
import { WSClient } from "@/websockets/client.ts";
import { ReactNode, useEffect, useRef } from "react";

export function WebSocketProvider({ children }: { children: ReactNode }) {
    // ws client should be a persistent object, i.e. we don't want/care about rerenders on its change
    const clientRef = useRef<WSClient | null>(null);

    if (!clientRef.current) {
        clientRef.current = new WSClient(WebsocketURLs.userChannel);
    }

    useEffect(() => {
        const client = clientRef.current;
        return () => {
            client?.close();
        };
    }, []);
    return <WSContext value={clientRef.current}>{children}</WSContext>;
}
