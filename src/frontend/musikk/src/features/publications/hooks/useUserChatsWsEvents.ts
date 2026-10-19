import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
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
    const userUUID = useUserUUID();

    useEffect(() => {
        return ws.subscribe("chat.messages.changed", (payload: ChatMessagesPayload) => {
            void client.invalidateQueries({
                queryKey: publicationKeys.chatMessages(userUUID, payload.chat_uuid),
            });
            void client.invalidateQueries({
                queryKey: publicationKeys.chatAttachments(userUUID, payload.chat_uuid),
            });
            void client.invalidateQueries({ queryKey: publicationKeys.userChats(userUUID) });
        });
    }, [ws, client, userUUID]);
}
