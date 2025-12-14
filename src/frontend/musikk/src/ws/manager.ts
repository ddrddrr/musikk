import { WSClient } from "./client";

// This manager is used due to weird React shenanigans
// prev simple solution with keeping a single instance in a ref and simply closing
// with useEffect didn't properly work in React DevMode
class WebSocketManager {
    private static client: WSClient | null = null;
    private static subscribers = 0;
    private static url: string = "";

    static connect(url: string): WSClient {
        this.subscribers++;

        if (this.client && this.url !== url) {
            console.debug("WS Manager URL changed, reconnecting");
            this.forceClose();
        }

        if (!this.client) {
            console.debug(`WS Manager Creating new connection (subscribers: ${this.subscribers})`);
            this.url = url;
            this.client = new WSClient(url);
        } else {
            console.debug(
                `WS Manager Reusing existing connection (subscribers: ${this.subscribers})`,
            );
        }

        return this.client;
    }

    static disconnect(): void {
        this.subscribers = Math.max(0, this.subscribers - 1);

        console.debug(`WS Manager Disconnect called (subscribers: ${this.subscribers})`);

        // close only when no components are using the connection
        if (this.subscribers === 0) {
            this.forceClose();
        }
    }

    private static forceClose(): void {
        if (this.client) {
            console.debug("WS Manager Closing connection");
            this.client.close();
            this.client = null;
            this.url = "";
        }
    }
}

export default WebSocketManager;
