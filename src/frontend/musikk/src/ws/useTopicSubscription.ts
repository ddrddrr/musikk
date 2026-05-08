import { useWSClient } from "@/hooks/useWSClient.ts";
import { useEffect } from "react";

export function useTopicSubscription(topic: string | null) {
    const ws = useWSClient();

    useEffect(() => {
        if (!topic) return;
        return ws.subscribeTopic(topic);
    }, [ws, topic]);
}
