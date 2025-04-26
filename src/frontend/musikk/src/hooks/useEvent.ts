import { refreshAccessToken } from "@/auth/authentication.ts";
import { useQueryClient } from "@tanstack/react-query";
import { EventSource } from "eventsource";
import Cookies from "js-cookie";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface useEventProps {
    eventUrl: string;
    deps: any[];
    isEnabled: boolean;
}

type IEventInvalidate = {
    invalidate: any[];
};

// TODO: add playback events

export function useEvent({ eventUrl, deps, isEnabled }: useEventProps) {
    const navigate = useNavigate();
    const client = useQueryClient();

    const handleEvent = useCallback(
        function handleEvent(event: MessageEvent) {
            const data: IEventInvalidate = JSON.parse(event.data);
            if (data) {
                if ("invalidate" in data) {
                    client.invalidateQueries({ queryKey: data.invalidate });
                }
            }
        },
        [client],
    );

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
                es.addEventListener("message", handleEvent);
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
    }, [eventUrl, navigate, ...deps, isEnabled]);
}
