import { RefObject, useEffect, useRef } from "react";

export function useAutoScrollToBottom(
    containerRef: RefObject<HTMLDivElement | null>,
    isPending: boolean,
    data: unknown,
) {
    const didInitialScrollRef = useRef(false);

    useEffect(() => {
        const container = containerRef.current;
        if (didInitialScrollRef.current || isPending || !data || !container) return;

        // scrollIntoView would also scroll the page around the list
        container.scrollTop = container.scrollHeight;
        didInitialScrollRef.current = true;
    }, [isPending, data, containerRef]);
}
