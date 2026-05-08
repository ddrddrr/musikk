import { useTopicSubscription } from "@/ws/useTopicSubscription.ts";

export function useChatWsEvents(chatUUID: string) {
    useTopicSubscription(`chat.${chatUUID}`);
}
