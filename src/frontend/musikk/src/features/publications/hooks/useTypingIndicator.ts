import { useEffect, useState } from "react";
import { useThrottledCallback } from "use-debounce";

import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useTopicSubscription } from "@/ws/useTopicSubscription.ts";

export interface Typer {
    userUUID: string;
    displayName: string;
}

type TyperEntry = Typer & { expiresAt: number };

interface TypingPayload {
    user_uuid: string;
    display_name: string;
}

const NOTIFY_INTERVAL_MS = 3000;
const TYPER_TTL_MS = 5000;
const REMOVE_STALE_MS = 1000;

export function useTypingIndicator(
    topic: string,
    eventName: string,
): {
    typers: Typer[];
    notifyTyping: () => void;
} {
    const ws = useWSClient();
    const currentUserUuid = useUserUUID();
    const [typers, setTypers] = useState<TyperEntry[]>([]);

    useTopicSubscription(topic);

    useEffect(() => {
        const unsubscribe = ws.subscribe(eventName, (payload: TypingPayload) => {
            if (!payload?.user_uuid || payload.user_uuid === currentUserUuid) return;
            const entry: TyperEntry = {
                userUUID: payload.user_uuid,
                displayName: payload.display_name,
                expiresAt: performance.now() + TYPER_TTL_MS,
            };
            setTypers((prev) => [...prev.filter((t) => t.userUUID !== entry.userUUID), entry]);
        });

        const removeStale = window.setInterval(() => {
            const now = performance.now();
            // return prev if similar so we don't rerender every sec
            setTypers((prev) => {
                const next = prev.filter((t) => t.expiresAt > now);
                return next.length === prev.length ? prev : next;
            });
        }, REMOVE_STALE_MS);

        return () => {
            unsubscribe();
            window.clearInterval(removeStale);
        };
    }, [ws, eventName, currentUserUuid]);

    const notifyTyping = useThrottledCallback(
        () => {
            ws.send({ action: "typing", payload: { topic } });
        },
        NOTIFY_INTERVAL_MS,
        { trailing: false },
    );

    return { typers, notifyTyping };
}
