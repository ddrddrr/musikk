import { RefObject, useEffect, useRef } from "react";

export function useAutoScrollToBottom(
    containerRef: RefObject<HTMLDivElement>,
    isPending: boolean,
    data: unknown,
) {
    const didInitialScrollRef = useRef(false);

    useEffect(() => {
        if (isPending || didInitialScrollRef.current || !data || !containerRef.current) return;

        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        didInitialScrollRef.current = true;
    }, [isPending, data, containerRef]);

    const scrollToBottom = () => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    };

    return scrollToBottom;
}