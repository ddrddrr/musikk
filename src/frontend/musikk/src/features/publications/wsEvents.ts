import { publicationKeys } from "@/features/publications/api/queryKeys.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type CollectionCommentsPayload = {
    collection_uuid: string;
};

type FeedCommentsPayload = {
    user_uuid: string;
};

type ChatMessagesPayload = {
    chat_uuid: string;
};

export function usePublicationWsEvents() {
    const ws = useWSClient();
    const client = useQueryClient();

    useEffect(() => {
        const unsubCollectionComments = ws.subscribe(
            "collection.comments.changed",
            (payload: CollectionCommentsPayload) => {
                void client.invalidateQueries({
                    queryKey: publicationKeys.collectionComments(payload.collection_uuid),
                });
            },
        );

        const unsubFeedComments = ws.subscribe(
            "feed.comments.changed",
            (payload: FeedCommentsPayload) => {
                void client.invalidateQueries({
                    queryKey: publicationKeys.feed(payload.user_uuid),
                });
            },
        );

        const unsubChatMessages = ws.subscribe(
            "chat.messages.changed",
            (payload: ChatMessagesPayload) => {
                void client.invalidateQueries({
                    predicate: (q) =>
                        q.queryKey[0] === "chat-messages" && q.queryKey[2] === payload.chat_uuid,
                });
            },
        );

        return () => {
            unsubCollectionComments();
            unsubFeedComments();
            unsubChatMessages();
        };
    }, [ws, client]);
}
