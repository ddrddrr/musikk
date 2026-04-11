import { RefObject, useCallback, useEffect, useRef, useState } from "react";

const NEAR_BOTTOM_THRESHOLD = 50; // px

// TODO: fix
export function useNewMessagesIndicator(
    containerRef: RefObject<HTMLDivElement | null>,
    bottomRef: RefObject<HTMLDivElement | null>,
    data: unknown,
) {
    const didInitialLoadRef = useRef(false);
    const isNearBottomRef = useRef(true);
    const [hasNewMessages, setHasNewMessages] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const distanceFromBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight;
            isNearBottomRef.current = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
            if (isNearBottomRef.current) {
                setHasNewMessages(false);
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [containerRef]);

    useEffect(() => {
        if (!data) return;

        if (!didInitialLoadRef.current) {
            didInitialLoadRef.current = true;
            return;
        }

        if (!isNearBottomRef.current) {
            setHasNewMessages(true);
        }
    }, [data]);

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setHasNewMessages(false);
    }, [bottomRef]);

    return { hasNewMessages, scrollToBottom };
}
