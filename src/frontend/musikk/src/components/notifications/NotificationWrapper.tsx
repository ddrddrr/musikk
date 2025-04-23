import { NotificationBox } from "@/components/notifications/NotificationBox.tsx";
import { NotificationURLs } from "@/config/endpoints.ts";
import { useQueryInvalidateEvent } from "@/hooks/useEvent.ts";
import { UserContext } from "@/providers/userContext.ts";
import { memo, useContext, useMemo } from "react";

// TODO: invalidate notif query when closed
export const NotificationWrapper = memo(function NotificationWrapper() {
    const { user } = useContext(UserContext);
    const isUserReady = useMemo(() => !!user?.uuid, [user]);

    const eventURL = useMemo(() => {
        return isUserReady ? NotificationURLs.replyEvents(user.uuid) : "";
    }, [isUserReady, user]);

    useQueryInvalidateEvent({
        eventUrl: eventURL,
        eventMsg: "invalidate",
        queryKey: ["replyNotifications"],
        deps: [user],
        isEnabled: isUserReady,
    });

    return <NotificationBox isUserReady={isUserReady} />;
});
