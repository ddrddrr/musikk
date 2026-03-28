import { userKeys } from "@/features/user/api/queryKeys.ts";
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
        const unsubUpdated = ws.subscribe("user.updated", (_payload: UserUpdatedPayload) => {
            // TODO: set the data instead of invalidating
            // not sure yet whether we want to show the update of the profile to other users that
            // have it open
            void client.invalidateQueries({ queryKey: userKeys.base });
        });

        const unsubFollowed = ws.subscribe("user.followed", (payload: UserFollowPayload) => {
            const { from_uuid, to_uuid } = payload;

            void client.invalidateQueries({ queryKey: userKeys.followed(from_uuid) });
            void client.invalidateQueries({ queryKey: userKeys.friends(from_uuid) });
            void client.invalidateQueries({ queryKey: userKeys.followers(to_uuid) });
        });

        const unsubUnfollowed = ws.subscribe("user.unfollowed", (payload: UserFollowPayload) => {
            const { from_uuid, to_uuid } = payload;

            void client.invalidateQueries({ queryKey: userKeys.followed(from_uuid) });
            void client.invalidateQueries({ queryKey: userKeys.friends(from_uuid) });
            void client.invalidateQueries({ queryKey: userKeys.followers(to_uuid) });
        });

        return () => {
            unsubUpdated();
            unsubFollowed();
            unsubUnfollowed();
        };
    }, [ws, client]);
}
