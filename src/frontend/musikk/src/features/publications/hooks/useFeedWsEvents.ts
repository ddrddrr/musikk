import { publicationKeys } from "@/features/publications/api/queryKeys.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useTopicSubscription } from "@/ws/useTopicSubscription.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type FeedCommentsPayload = {
    user_uuid: string;
};

export function useFeedWsEvents(userUUID: string) {
    const ws = useWSClient();
    const client = useQueryClient();

    useTopicSubscription(`feed.${userUUID}`);

    useEffect(() => {
        return ws.subscribe("feed.comments.changed", (payload: FeedCommentsPayload) => {
            void client.invalidateQueries({
                queryKey: publicationKeys.feed(payload.user_uuid),
            });
        });
    }, [ws, client]);
}
