import { publicationKeys } from "@/features/publications/api/queryKeys.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type ChatMessagesPayload = {
    chat_uuid: string;
};

export function useUserChatsWsEvents() {
    const ws = useWSClient();
    const client = useQueryClient();

    useEffect(() => {
        return ws.subscribe("chat.messages.changed", (payload: ChatMessagesPayload) => {
            void client.invalidateQueries({
                queryKey: publicationKeys.chatMessages(payload.chat_uuid),
            });
            void client.invalidateQueries({
                queryKey: publicationKeys.chatAttachments(payload.chat_uuid),
            });
            void client.invalidateQueries({ queryKey: ["user-chats"] });
        });
    }, [ws, client]);
}
