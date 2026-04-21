import { publicationKeys } from "@/features/publications/api/queryKeys.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useTopicSubscription } from "@/ws/useTopicSubscription.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type CollectionCommentsPayload = {
    collection_uuid: string;
};

export function useCollectionCommentsWsEvents(collectionUUID: string) {
    const ws = useWSClient();
    const client = useQueryClient();

    useTopicSubscription(`collection_comments.${collectionUUID}`);

    useEffect(() => {
        return ws.subscribe("collection.comments.changed", (payload: CollectionCommentsPayload) => {
            void client.invalidateQueries({
                queryKey: publicationKeys.collectionComments(payload.collection_uuid),
            });
        });
    }, [ws, client]);
}
