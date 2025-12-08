import { api_client } from "@/api/axiosConf.ts";
import { UserURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { IUser } from "@/modules/user/types.ts";
import { useQuery } from "@tanstack/react-query";

export async function fetchMe(): Promise<IUser | null> {
    const res = await api_client.get(UserURLs.me);
    return res.data.me;
}

export async function fetchUser(userUUID: UUID): Promise<IUser> {
    const res = await api_client.get(UserURLs.userDetail(userUUID));
    return res.data;
}

export function useUserFriendsQuery(userUUID: UUID | undefined, enabled: boolean = true) {
    return useQuery({
        queryKey: ["user", "friends", userUUID],
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
        queryKey: ["user", "followers", userUUID],
        queryFn: userUUID
            ? async () => {
                  const res = await api_client.get(UserURLs.userFollowers(userUUID));
                  return res.data.friends;
              }
            : undefined,
        enabled: enabled,
    });
}
