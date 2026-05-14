import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px), (pointer: coarse) and (max-width: 1023px)";

export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === "undefined") {
            return false;
        }
        return window.matchMedia(MOBILE_QUERY).matches;
    });

    useEffect(() => {
        const mql = window.matchMedia(MOBILE_QUERY);
        const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return isMobile;
}
