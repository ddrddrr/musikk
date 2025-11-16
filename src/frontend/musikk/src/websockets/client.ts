interface ServerEvent {
    event: string;
    payload: unknown;
}

interface UserAction {
    action: string;
    payload: unknown;
}

type MessageHandler = (payload: unknown) => void;

const MAX_RECONNECTS = 10;
const RECONNECT_DELAY = 1000; // ms

export class WSClient {
    private ws: WebSocket | null = null;
    private url: string;
    private shouldReconnect: boolean = true;
    private currReconnects = 0;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    private listeners = new Map<string, Set<MessageHandler>>();
    private pendingMessages: string[] = [];

    constructor(url: string) {
        this.url = url;
        this.connect();
    }

    private connect() {
        if (
            this.ws &&
            (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)
        ) {
            console.debug("WS conn already exists, skipping connect");
            return;
        }

        if (this.ws) {
            this.ws.close();
        }

        console.debug(`WS connecting to ${this.url}`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.debug("WS conn established");
            this.currReconnects = 0;

            // Flush pending messages
            if (this.pendingMessages.length > 0) {
                console.debug(`WS Flushing ${this.pendingMessages.length} pending messages`);
                for (const msg of this.pendingMessages) {
                    this.ws?.send(msg);
                }
                this.pendingMessages = [];
            }
        };

        this.ws.onmessage = (e) => {
            let data: ServerEvent;
            try {
                data = JSON.parse(e.data);
            } catch {
                console.debug("WS Invalid JSON payload:", e.data);
                return;
            }

            const type = data?.event;
            if (!type) {
                console.debug("WS Received message without event type:", data);
                return;
            }

            const listeners = this.listeners.get(type);
            if (!listeners || listeners.size === 0) {
                console.debug(`WS No listeners for event '${type}'`);
                return;
            }

            const payload = data?.payload;
            for (const handler of listeners) {
                try {
                    handler(payload);
                } catch (error) {
                    console.error(`WS Error in event handler for '${type}':`, error);
                }
            }
        };

        this.ws.onerror = (e) => {
            console.error("WS Connection error", e);
        };

        this.ws.onclose = (event) => {
            const reason = event.reason || "No reason provided";
            console.debug(`WS Connection closed (code: ${event.code}, reason: ${reason})`);
            this.ws = null;

            // Attempt reconnection for abnormal closures
            if (
                this.shouldReconnect &&
                event.code !== 1000 &&
                this.currReconnects < MAX_RECONNECTS
            ) {
                this.currReconnects++;
                const delay = RECONNECT_DELAY * this.currReconnects;
                console.debug(
                    `WS Attempting reconnect ${this.currReconnects}/${MAX_RECONNECTS} in ${delay}ms`,
                );

                this.reconnectTimeout = setTimeout(() => {
                    this.connect();
                }, delay);
            } else if (this.currReconnects >= MAX_RECONNECTS) {
                console.error("WS Max reconnection attempts reached");
            }
        };
    }

    close() {
        console.debug("WS Closing connection manually");
        this.shouldReconnect = false;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.ws?.close(1000, "manual close");
        this.ws = null;
    }

    send({ action, payload }: UserAction) {
        const message = JSON.stringify({ type: action, payload });

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            console.debug(`WS Connection not ready, queueing message ${action}`);
            this.pendingMessages.push(message);
        }
    }

    subscribe(event: string, handler: MessageHandler): () => void {
        let listeners = this.listeners.get(event);
        if (!listeners) {
            listeners = new Set();
            this.listeners.set(event, listeners);
        }
        listeners.add(handler);

        console.debug(`WS Subscribed to event '${event}'`);

        return () => {
            listeners?.delete(handler);
            if (listeners && listeners.size === 0) {
                this.listeners.delete(event);
                console.debug(`WS Unsubscribed from event '${event}'`);
            }
        };
    }

    getReadyState(): number {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}
