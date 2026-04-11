import { RefObject, useCallback, useEffect, useRef, useState } from "react";

const NEAR_BOTTOM_THRESHOLD = 50; // px

function distanceFromBottom(container: HTMLElement): number {
    return container.scrollHeight - container.scrollTop - container.clientHeight;
}

export function useNewMessagesIndicator(
    containerRef: RefObject<HTMLDivElement | null>,
    bottomRef: RefObject<HTMLDivElement | null>,
    messages: { uuid: string }[],
) {
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const lastUUIDRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (distanceFromBottom(container) < NEAR_BOTTOM_THRESHOLD) {
                setHasNewMessages(false);
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    });

    useEffect(() => {
        const newest = messages.at(-1)?.uuid;
        const prev = lastUUIDRef.current;
        lastUUIDRef.current = newest;

        if (!prev || newest === prev) return;

        const container = containerRef.current;
        if (!container) return;

        if (distanceFromBottom(container) >= NEAR_BOTTOM_THRESHOLD) {
            setHasNewMessages(true);
        }
    }, [messages, containerRef]);

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setHasNewMessages(false);
    }, [bottomRef]);

    return { hasNewMessages, scrollToBottom };
}
