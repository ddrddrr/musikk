import { WSContext } from "@/providers/websocketContext";
import { WSClient } from "@/websockets/client";
import { useContext } from "react";

export function useWSClient(): WSClient {
    const client = useContext(WSContext);
    if (!client) {
        throw new Error("useWSClient must be used within WebSocketProvider");
    }
    return client;
}
