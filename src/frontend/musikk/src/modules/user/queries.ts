import { api_client } from "@/api/axiosConf.ts";
import { UserURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { IUserBaseProfile } from "@/modules/user/types.ts";
import { useQuery } from "@tanstack/react-query";

export async function fetchMe(): Promise<IUserBaseProfile | null> {
    const res = await api_client.get(UserURLs.me);
    return res.data;
}

export async function fetchUser(userUUID: UUID): Promise<IUserBaseProfile> {
    const res = await api_client.get(UserURLs.userDetail(userUUID));
    return res.data;
}

export function useUserFriendsQuery(userUUID: UUID | undefined, enabled: boolean = true) {
    return useQuery({
        queryKey: ["user", "friends", userUUID],
        queryFn: userUUID
            ? async () => {
                  const res = await api_client.get(UserURLs.userFriends(userUUID));
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
                  const res = await api_client.get(UserURLs.userFollowed(userUUID));
                  return res.data;
              }
            : undefined,
        enabled: enabled,
    });
}
