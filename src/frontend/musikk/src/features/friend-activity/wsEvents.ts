import { friendActivityKeys } from "@/features/friend-activity/queryKeys.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type ListeningChangedPayload = {
    user_uuid: string;
};

export function useFriendActivityWsEvents() {
    const ws = useWSClient();
    const client = useQueryClient();

    useEffect(() => {
        return ws.subscribe("friend-activity.listening.changed", (payload: ListeningChangedPayload) => {
            void client.invalidateQueries({
                queryKey: friendActivityKeys.listening(payload.user_uuid),
            });
        });
    }, [ws, client]);
}
