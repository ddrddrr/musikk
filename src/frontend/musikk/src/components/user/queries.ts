import { IUser } from "@/components/user/types.ts";
import { api } from "@/config/axiosConf.ts";
import { UserURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";
import { useQuery } from "@tanstack/react-query";

export async function fetchUser(userUUID: UUID): Promise<IUser> {
    const res = await api.get(UserURLs.userDetail(userUUID));
    return res.data;
}

export function useUserFriendsQuery(userUUID: UUID | undefined, enabled: boolean = true) {
    return useQuery({
        queryKey: ["user", "friends", userUUID],
        queryFn: userUUID
            ? async () => {
                  const res = await api.get(UserURLs.userFriends(userUUID));
                  return res.data;
              }
            : undefined,
        enabled: enabled,
    });
}

export function useUserFollowedQuery(userUUID: UUID|undefined, enabled: boolean = true) {
    return useQuery({
        queryKey: ["user", "followed", userUUID],
        queryFn: userUUID
            ? async () => {
                  const res = await api.get(UserURLs.userFollowed(userUUID));
                  return res.data;
              }
            : undefined,
        enabled: enabled,
    });
}
