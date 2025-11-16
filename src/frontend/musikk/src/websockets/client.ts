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

export class WSClient {
    private ws: WebSocket | null = null;
    private url: string;
    private shouldReconnect: boolean = true;
    private currReconnects = 0;

    private listeners = new Map<string, Set<MessageHandler>>();
    private pendingMessages: string[] = [];

    constructor(url: string) {
        this.url = url;
        this.connect();
    }

    private connect() {
        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            this.currReconnects = 0;

            // flush pending messages
            for (const msg of this.pendingMessages) {
                this.ws?.send(msg);
            }
            this.pendingMessages = [];
        };

        this.ws.onmessage = (e) => {
            let data: ServerEvent;
            try {
                data = JSON.parse(e.data);
            } catch {
                console.debug("WS invalid JSON Payload:", e.data);
                return;
            }

            const type = data?.event;
            if (!type) return;

            const listeners = this.listeners.get(type);
            if (!listeners) return;

            const payload = data?.payload;
            for (const handler of listeners) {
                handler(payload);
            }
        };

        this.ws.onerror = (e) => {
            // TODO: handle somehow
            console.debug(`WS Error ${e.type}`);
        };

        this.ws.onclose = () => {
            this.ws = null;

            if (this.shouldReconnect) {
                while (this.currReconnects < MAX_RECONNECTS) {
                    this.currReconnects += 1;
                    const delay = 1000;
                    setTimeout(() => this.connect(), delay);
                }
            }
        };
    }

    close() {
        this.ws?.close(1000, "manual close");
    }

    send({ action, payload }: UserAction) {
        const message = JSON.stringify({ type: action, payload });
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            this.pendingMessages.push(message);
        }
    }

    subscribe(type: string, handler: MessageHandler): () => void {
        let set = this.listeners.get(type);
        if (!set) {
            set = new Set();
            this.listeners.set(type, set);
        }
        set.add(handler);

        return () => {
            set?.delete(handler);
            if (set && set.size === 0) {
                this.listeners.delete(type);
            }
        };
    }
}
