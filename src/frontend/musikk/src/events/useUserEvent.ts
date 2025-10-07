import { EventURLs } from "@/config/endpoints.ts";
import { useEvent } from "@/events/useEvent.ts";
import { UserContext } from "@/providers/userContext.ts";
import { useContext, useMemo } from "react";

interface useUserEventProps {
    handleEvent: (event: MessageEvent) => void;
    eventKey: string;
    deps?: any[];
    isEnabled?: boolean;
}

export function useUserEvent({ handleEvent, eventKey, deps = [], isEnabled = true }: useUserEventProps) {
    const { user } = useContext(UserContext);

    const eventUrl = useMemo(() => (user?.uuid ? EventURLs.userEvents : ""), [user?.uuid]);

    useEvent({
        eventUrl,
        handleEvent,
        eventKey,
        deps: [...deps, user?.uuid],
        isEnabled: isEnabled && !!user,
    });
}
