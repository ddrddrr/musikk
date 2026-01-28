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

export function useUserWsEvents() {
    const ws = useWSClient();
    const client = useQueryClient();

    useEffect(() => {
        ws.subscribe("user.updated", (payload: UserUpdatedPayload) => {
            // TODO: set the data instead of invalidating
            // not sure yet whether we want to show the update of the profile to other users that
            // have it open
            void client.invalidateQueries({ queryKey: ["user"] });
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
