import { WebsocketURLs } from "@/api/endpoints.ts";
import { useEffect } from "react";

interface ServerMessage {
    type: string;
    payload: unknown;
}

export function useUserWSChannel() {
    useEffect(() => {
        const ws = new WebSocket(WebsocketURLs.userChannel);

        ws.onopen = () => console.log("ws opened");
        ws.onclose = () => console.log("ws closed");

        ws.addEventListener("message", (e) => {
            console.log(`Recieved ws event ${e.type}`);
            const data = JSON.parse(e.data as string) as ServerMessage;
            console.log("ws message type:", data.type);
            console.log("ws message payload:", data.payload);
        });

        ws.addEventListener("error", (e) => {
            console.log(`WS error ${e.type}`);
        });
    }, []);
}
