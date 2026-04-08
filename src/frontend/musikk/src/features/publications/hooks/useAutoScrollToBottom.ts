import { RefObject, useEffect, useRef } from "react";

// adapted from https://stackoverflow.com/questions/37620694/how-to-scroll-to-bottom-in-react
// (the invisible div approach)
export function useAutoScrollToBottom(
    bottomRef: RefObject<HTMLDivElement | null>,
    isPending: boolean,
    data: unknown,
) {
    const didInitialScrollRef = useRef(false);

    useEffect(() => {
        if (didInitialScrollRef.current || isPending || !data || !bottomRef.current) return;

        bottomRef.current.scrollIntoView();
        didInitialScrollRef.current = true;
    }, [isPending, data, bottomRef]);
}
