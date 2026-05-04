interface ServerEvent {
    event: string;
    payload: any;
}

interface UserAction {
    action: string;
    payload: any;
}

type MessageHandler = (payload: any) => void;

const RECONNECT_BASE_DELAY_MS = 500;
const RECONNECT_MAX_DELAY_MS = 30000;

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

            for (const topic of this.topicSubscriptions.keys()) {
                this.ws?.send(JSON.stringify({ action: "subscribe", payload: { topic } }));
            }

            if (this.pendingMessages.length > 0) {
                console.debug(`WS Flushing ${this.pendingMessages.length} pending messages`);
            }
            this.flush();
        };

        this.ws.onmessage = (e) => {
            let data: ServerEvent;
            try {
                data = JSON.parse(e.data);
            } catch {
                console.debug("WS Invalid JSON payload:", e.data);
                return;
            }

            const eventType = data?.event;
            if (!eventType) {
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

        this.ws.onerror = (e) => {
            console.error("WS Connection error", e);
        };

        this.ws.onclose = (event) => {
            const reason = event.reason || "No reason provided";
            console.debug(`WS Connection closed (code: ${event.code}, reason: ${reason})`);
            this.ws = null;

            if (!this.shouldReconnect || event.code === 1000) {
                return;
            }

            this.scheduleReconnect();
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

    send({ action, payload }: UserAction) {
        this.pendingMessages.push(JSON.stringify({ action, payload }));
        this.flush();
    }

    // the invariant is that the pendingMessages arr is empty before we call send()
    // and after onopen (in connect)
    private flush() {
        const ws = this.ws;
        if (ws?.readyState !== WebSocket.OPEN) return;
        while (this.pendingMessages.length > 0) {
            ws.send(this.pendingMessages.shift()!);
        }
    }

    // used e.g. by subscribeTopic
    // because we need create the sub immediatelly and increment the sub count
    // otherwise we can re-subscribe if there are a lot of pending messages
    // and another sub request comes in
    // (checks that there are no subs since the sub req is queued -> queues again)
    private sendNow(action: UserAction) {
        const ws = this.ws;
        if (ws?.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify(action));
    }

    subscribeTopic(topic: string): () => void {
        const count = this.topicSubscriptions.get(topic) ?? 0;
        this.topicSubscriptions.set(topic, count + 1);

        if (count === 0) {
            this.sendNow({ action: "subscribe", payload: { topic } });
        }

        return () => {
            const current = this.topicSubscriptions.get(topic) ?? 0;
            if (current <= 1) {
                this.topicSubscriptions.delete(topic);
                this.sendNow({ action: "unsubscribe", payload: { topic } });
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
