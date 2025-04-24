import { refreshAccessToken } from "@/auth/authentication.ts";
import { useQueryClient } from "@tanstack/react-query";
import { EventSource } from "eventsource";
import Cookies from "js-cookie";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface useEventProps {
    eventUrl: string;
    onEvent: (MessageEvent: MessageEvent) => void;
    deps: any[];
    isEnabled: boolean;
}

// TODO: make notification events subscribe on home page mount

export function useEvent({ eventUrl, onEvent, deps, isEnabled }: useEventProps) {
    const navigate = useNavigate();
    // pain...
    useEffect(() => {
        if (!isEnabled) return;
        let es: EventSource | null = null;
        let token = Cookies.get("access");

        const createEventSource = async () => {
            try {
                es = new EventSource(eventUrl, {
                    fetch: (input, init) =>
                        fetch(input, {
                            ...init,
                            headers: {
                                ...init?.headers,
                                Authorization: `Bearer ${token}`,
                            },
                        }),
                });
                console.log("created eventsrouce", eventUrl);
                es.addEventListener("message", onEvent);
                es.addEventListener("error", async (e: any) => {
                    // handle tokens
                    if (e?.status === 401 || e?.target?.readyState === EventSource.CLOSED) {
                        es?.close();
                        try {
                            await refreshAccessToken();
                            token = Cookies.get("access");
                            createEventSource();
                        } catch {
                            navigate("/login");
                        }
                    }
                });
            } catch (err) {
                console.log(err);
            }
        };

        createEventSource();

        return () => {
            console.log("deleted eventsource", es?.url);
            es?.close();
        };
    }, [eventUrl, onEvent, navigate, ...deps, isEnabled]);
}

interface useQueryInvalidateEventProps {
    eventUrl: string;
    eventMsg: string;
    queryKey: any[];
    deps: any[];
    isEnabled: boolean;
}

export function useQueryInvalidateEvent({
    eventUrl,
    eventMsg,
    queryKey,
    deps,
    isEnabled,
}: useQueryInvalidateEventProps) {
    const client = useQueryClient();

    const handleEvent = useCallback(
        (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (eventMsg in data) {
                client.invalidateQueries({ queryKey });
            }
        },
        [eventMsg, client, queryKey],
    );

    useEvent({
        eventUrl,
        onEvent: handleEvent,
        deps: [...deps, client],
        isEnabled,
    });
}
