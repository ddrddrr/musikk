interface ServerEvent {
    event?: unknown;
    payload?: unknown;
}

interface UserAction {
    action: string;
    payload: unknown;
}

type MessageHandler = (payload: unknown) => void;

const RECONNECT_BASE_DELAY_MS = 500;
const RECONNECT_MAX_DELAY_MS = 30000;

function runHandler(handler: () => void, kind: string) {
    try {
        handler();
    } catch (error) {
        console.error(`WS Error in ${kind} handler:`, error);
    }
}

export class WSClient {
    private ws: WebSocket | null = null;
    private url: string;
    private shouldReconnect: boolean = true;
    private currReconnects = 0;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    private listeners = new Map<string, Set<MessageHandler>>();
    private topicSubscriptions = new Map<string, number>();
    private openHandlers = new Set<() => void>();
    private closeHandlers = new Set<() => void>();

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
        const socket = new WebSocket(this.url);
        this.ws = socket;

        socket.onopen = () => {
            if (this.ws !== socket) return;
            console.debug("WS conn established");
            this.currReconnects = 0;

            for (const topic of this.topicSubscriptions.keys()) {
                socket.send(JSON.stringify({ action: "subscribe", payload: { topic } }));
            }

            for (const handler of this.openHandlers) {
                runHandler(handler, "open");
            }
        };

        socket.onmessage = (e: MessageEvent<string>) => {
            if (this.ws !== socket) return;
            let data: ServerEvent | null;
            try {
                data = JSON.parse(e.data) as ServerEvent | null;
            } catch {
                console.debug("WS Invalid JSON payload:", e.data);
                return;
            }

            const eventType = data?.event;
            if (typeof eventType !== "string" || !eventType) {
                console.debug("WS Received message without event type:", data);
                return;
            }

            const listeners = this.listeners.get(eventType);
            if (!listeners || listeners.size === 0) {
                console.debug(`WS No listeners for event '${eventType}'`);
                return;
            }

            const payload = data?.payload;
            for (const handler of listeners) {
                try {
                    handler(payload);
                } catch (error) {
                    console.error(`WS Error in event handler for '${eventType}':`, error);
                }
            }
        };

        socket.onerror = (e) => {
            if (this.ws !== socket) return;
            console.error("WS Connection error", e);
        };

        socket.onclose = (event) => {
            if (this.ws !== socket) return;
            const reason = event.reason || "No reason provided";
            console.debug(`WS Connection closed (code: ${event.code}, reason: ${reason})`);
            this.ws = null;

            if (!this.shouldReconnect || event.code === 1000) {
                return;
            }

            this.scheduleReconnect();
            for (const handler of this.closeHandlers) {
                runHandler(handler, "close");
            }
        };
    }

    private scheduleReconnect() {
        if (this.reconnectTimeout) {
            return;
        }

        const exp = Math.min(
            RECONNECT_MAX_DELAY_MS,
            RECONNECT_BASE_DELAY_MS * 2 ** this.currReconnects,
        );
        // jitter, see https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
        // helps, e.g, with possible simulatenous reconnects of multiple clients
        const delay = Math.floor(Math.random() * exp);
        this.currReconnects++;

        console.debug(`WS Reconnect attempt ${this.currReconnects} in ${delay}ms`);
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, delay);
    }

    private isOpen(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    // used on `visibilitychange` -> visible or `online`
    reconnect() {
        if (this.isOpen()) {
            return;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.currReconnects = 0;
        this.connect();
    }

    close() {
        console.debug("WS Closing connection manually");
        this.shouldReconnect = false;
        this.topicSubscriptions.clear();

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.ws?.close(1000, "manual close");
        this.ws = null;
    }

    // an action sent while the connection is down is dropped, because after the reconnect
    // it may be stale, e.g. a pause clicked minutes ago would pause a song started since then
    send({ action, payload }: UserAction) {
        const ws = this.ws;
        if (ws?.readyState !== WebSocket.OPEN) {
            console.debug(`WS Dropped action '${action}', the connection is not open`);
            return;
        }
        ws.send(JSON.stringify({ action, payload }));
    }

    onOpen(handler: () => void): () => void {
        this.openHandlers.add(handler);
        if (this.isOpen()) {
            runHandler(handler, "open");
        }
        return () => {
            this.openHandlers.delete(handler);
        };
    }

    // runs when the connection drops and a reconnect is scheduled, not on a manual close
    onClose(handler: () => void): () => void {
        this.closeHandlers.add(handler);
        return () => {
            this.closeHandlers.delete(handler);
        };
    }

    subscribeTopic(topic: string): () => void {
        const count = this.topicSubscriptions.get(topic) ?? 0;
        this.topicSubscriptions.set(topic, count + 1);

        if (count === 0) {
            this.send({ action: "subscribe", payload: { topic } });
        }

        return () => {
            const current = this.topicSubscriptions.get(topic) ?? 0;
            if (current <= 1) {
                this.topicSubscriptions.delete(topic);
                this.send({ action: "unsubscribe", payload: { topic } });
            } else {
                this.topicSubscriptions.set(topic, current - 1);
            }
        };
    }

    // returns a func that should be called in useEffect, since we need to clear
    // the listener list eventually, otherwise there'll be a memory leak
    subscribe<T>(event: string, handler: (payload: T) => void): () => void {
        let listeners = this.listeners.get(event);
        if (!listeners) {
            listeners = new Set();
            this.listeners.set(event, listeners);
        }
        const messageHandler = handler as MessageHandler;
        listeners.add(messageHandler);

        console.debug(`WS Subscribed to event '${event}'`);

        return () => {
            listeners?.delete(messageHandler);
            if (listeners && listeners.size === 0) {
                this.listeners.delete(event);
                console.debug(`WS Unsubscribed from event '${event}'`);
            }
        };
    }
}
