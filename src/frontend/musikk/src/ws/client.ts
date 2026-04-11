interface ServerEvent {
    event: string;
    payload: any;
}

interface UserAction {
    action: string;
    payload: any;
}

type MessageHandler = (payload: any) => void;

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
    private topicSubscriptions = new Map<string, number>();

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

            if (this.pendingMessages.length > 0) {
                console.debug(`WS Flushing ${this.pendingMessages.length} pending messages`);
                for (const msg of this.pendingMessages) {
                    this.ws?.send(msg);
                }
                this.pendingMessages = [];
            }

            for (const topic of this.topicSubscriptions.keys()) {
                this.ws?.send(JSON.stringify({ action: "subscribe", payload: { topic } }));
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

            // TODO: add exp backoff
            // reconnect on non-standard close
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
        this.topicSubscriptions.clear();

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.ws?.close(1000, "manual close");
        this.ws = null;
    }

    send({ action, payload }: UserAction) {
        const message = JSON.stringify({ action: action, payload: payload });

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            console.debug(`WS Connection not ready, queueing message ${action}`);
            this.pendingMessages.push(message);
        }
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
}
