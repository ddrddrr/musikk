import { useWSClient } from "@/hooks/useWSClient.ts";
import { useTopicSubscription } from "@/ws/useTopicSubscription.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type ChatMessagesPayload = {
    chat_uuid: string;
};

export function useChatWsEvents(chatUUID: string) {
    const ws = useWSClient();
    const client = useQueryClient();

    useTopicSubscription(`chat.${chatUUID}`);

    useEffect(() => {
        return ws.subscribe("chat.messages.changed", (payload: ChatMessagesPayload) => {
            void client.invalidateQueries({
                queryKey: ["chat-messages", payload.chat_uuid],
            });
            void client.invalidateQueries({
                queryKey: ["chat-attachments", payload.chat_uuid],
            });
        });
    }, [ws, client]);
}
