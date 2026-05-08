import { RefObject, useLayoutEffect, useRef } from "react";

export function useScrollAnchor(
    containerRef: RefObject<HTMLElement | null>,
    isFetchingNextPage: boolean,
) {
    const prevScrollHeightRef = useRef(0);
    const wasFetchingRef = useRef(false);

    // no dependency array because keeps prevScrollHeightRef current across all renders,
    // so the delta only reflects prepended content, not unrelated height changes
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (wasFetchingRef.current && !isFetchingNextPage) {
            const delta = container.scrollHeight - prevScrollHeightRef.current;
            if (delta > 0) {
                container.scrollTop += delta;
            }
        }

        prevScrollHeightRef.current = container.scrollHeight;
        wasFetchingRef.current = isFetchingNextPage;
    });
}
