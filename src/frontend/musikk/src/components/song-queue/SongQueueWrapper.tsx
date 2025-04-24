import { SongQueue } from "@/components/song-queue/SongQueue.tsx";
import { QueueURLs } from "@/config/endpoints.ts";
import { useQueryInvalidateEvent } from "@/hooks/useEvent.ts";
import { UserContext } from "@/providers/userContext.ts";
import { memo, useContext, useMemo } from "react";

export const SongQueueWrapper = memo(function SongQueueWrapper() {
    const { user } = useContext(UserContext);

    const isUserReady = useMemo(() => !!user?.uuid, [user]);
    const eventURL = useMemo(() => {
        return isUserReady ? QueueURLs.queueEvents : "";
    }, [isUserReady]);

    useQueryInvalidateEvent({
        eventUrl: eventURL,
        eventMsg: "invalidate",
        queryKey: ["queue"],
        deps: [user],
        isEnabled: true,
    });

    return <SongQueue />;
});
