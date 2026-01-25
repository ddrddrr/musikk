import { BaseUser } from "@/features/user/types.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type UserUpdatedPayload = {
    user: BaseUser;
};

type UserFollowPayload = {
    from_uuid: string;
    to_uuid: string;
};

export function useWsEvents() {
    const ws = useWSClient();
    const client = useQueryClient();

    useEffect(() => {
        ws.subscribe("user.updated", (payload: UserUpdatedPayload) => {
            client.setQueryData(["user"], { me: payload.user });
        });

        ws.subscribe("user.followed", (payload: UserFollowPayload) => {
            const { from_uuid, to_uuid } = payload;

            void client.invalidateQueries({
                queryKey: ["user", from_uuid, "followed"],
            });
            void client.invalidateQueries({
                queryKey: ["user", from_uuid, "friends"],
            });
            void client.invalidateQueries({
                queryKey: ["user", to_uuid, "followers"],
            });
        });

        ws.subscribe("user.unfollowed", (payload: UserFollowPayload) => {
            const { from_uuid, to_uuid } = payload;

            void client.invalidateQueries({
                queryKey: ["user", from_uuid, "followed"],
            });
            void client.invalidateQueries({
                queryKey: ["user", from_uuid, "friends"],
            });
            void client.invalidateQueries({
                queryKey: ["user", to_uuid, "followers"],
            });
        });
    }, [ws, client]);
}
