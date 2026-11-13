import { UUID } from "@/api/types.ts";
import { publicationKeys } from "@/features/publications/api/queryKeys.ts";
import { CommentableObjectRef, CommentableObjectType } from "@/features/publications/types.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { commentsTopic } from "@/ws/topics.ts";
import { useTopicSubscription } from "@/ws/useTopicSubscription.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

interface CommentsChangedEvent {
    name: string;
    // the payload key that holds the object's uuid, the URL kwarg name on the backend
    uuidKey: string;
}

const COMMENTS_CHANGED_EVENT: Record<CommentableObjectType, CommentsChangedEvent> = {
    collection: { name: "collection.comments.changed", uuidKey: "collection_uuid" },
    song: { name: "song.comments.changed", uuidKey: "song_uuid" },
};

type CommentsChangedPayload = Partial<Record<string, UUID>>;

export function useCommentsWsEvents(commentable: CommentableObjectRef) {
    const ws = useWSClient();
    const client = useQueryClient();
    const { type } = commentable;

    useTopicSubscription(commentsTopic(commentable));

    useEffect(() => {
        const { name, uuidKey } = COMMENTS_CHANGED_EVENT[type];
        return ws.subscribe(name, (payload: CommentsChangedPayload) => {
            const uuid = payload[uuidKey];
            if (!uuid) return;
            void client.invalidateQueries({ queryKey: publicationKeys.comments({ type, uuid }) });
        });
    }, [ws, client, type]);
}
