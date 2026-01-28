import { api_client } from "@/api/axiosConf.ts";
import { UUID } from "@/api/types.ts";
import { BaseUser } from "@/features/user/types.ts";
import { useQuery } from "@tanstack/react-query";
import { UserURLs } from "@/features/user/api/endpoints.ts";

export async function fetchMe(): Promise<BaseUser | null> {
    const res = await api_client.get(UserURLs.me);
    return res.data.me;
}

export async function fetchUser(userUUID: UUID): Promise<BaseUser> {
    const res = await api_client.get(UserURLs.userRetrieve(userUUID));
    return res.data;
}

export function useUserFriendsQuery(userUUID: UUID | undefined, enabled: boolean = true) {
    return useQuery({
        queryKey: ["user", userUUID, "friends"],
        queryFn: userUUID
            ? async () => {
                  const res = await api_client.get(UserURLs.userFriends(userUUID));
                  return res.data.friends;
              }
            : undefined,
        enabled: enabled,
    });
}

export function useUserFollowersQuery(userUUID: UUID | undefined, enabled: boolean = true) {
    return useQuery({
        queryKey: ["user", userUUID, "followers"],
        queryFn: userUUID
            ? async () => {
                  const res = await api_client.get(UserURLs.userFollowers(userUUID));
                  return res.data.followers;
              }
            : undefined,
        enabled: enabled,
    });
}

export function useUserFollowedQuery(userUUID: UUID | undefined, enabled: boolean = true) {
    return useQuery({
        queryKey: ["user", userUUID, "followed"],
        queryFn: userUUID
            ? async () => {
                  const res = await api_client.get(UserURLs.userFollowed(userUUID));
                  return res.data.followed;
              }
            : undefined,
        enabled: enabled,
    });
}
