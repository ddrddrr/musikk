import { chatTopic } from "@/ws/topics.ts";
import { useTopicSubscription } from "@/ws/useTopicSubscription.ts";

export function useChatWsEvents(chatUUID: string) {
    useTopicSubscription(chatTopic(chatUUID));
}
