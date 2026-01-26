import { WSClient } from "./client";

// This manager is used due to weird React shenanigans
// prev simple solution with keeping a single instance in a ref and simply closing
// with useEffect didn't properly work...
class WebSocketManager {
    private static client: WSClient | null = null;
    private static subscribers = 0;
    private static url: string = "";

    static connect(url: string): WSClient {
        this.subscribers++;

        if (this.client && this.url !== url) {
            this.forceClose();
        }

        if (!this.client) {
            this.url = url;
            this.client = new WSClient(url);
        }

        return this.client;
    }

    static disconnect(): void {
        this.subscribers = Math.max(0, this.subscribers - 1);
        if (this.subscribers === 0) {
            this.forceClose();
        }
    }

    private static forceClose(): void {
        if (this.client) {
            this.client.close();
            this.client = null;
            this.url = "";
        }
    }
}

export default WebSocketManager;
