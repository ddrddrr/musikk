import { api } from "@/api/axiosConf.ts";
import { UserURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { IUser } from "@/components/user/types.ts";
import { useQuery } from "@tanstack/react-query";

export async function fetchMe(): Promise<IUser | null> {
    const res = await api.get(UserURLs.me);
    return res.data;
}

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

export function useUserFollowedQuery(userUUID: UUID | undefined, enabled: boolean = true) {
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
