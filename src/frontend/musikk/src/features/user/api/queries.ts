import { api_client } from "@/api/axiosConf.ts";
import { UUID } from "@/api/types.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { BaseUser } from "@/features/user/types.ts";
import { skipToken, useQuery } from "@tanstack/react-query";
import { UserURLs } from "@/features/user/api/endpoints.ts";

export async function fetchMe(): Promise<BaseUser | null> {
    const res = await api_client.get(UserURLs.me);
    return res.data.me;
}

export async function fetchUser(userUUID: UUID): Promise<BaseUser> {
    const res = await api_client.get(UserURLs.userRetrieve(userUUID));
    return res.data;
}

async function fetchUserFriends(userUUID: UUID) {
    const res = await api_client.get(UserURLs.userFriends(userUUID));
    return res.data.friends;
}

async function fetchUserFollowers(userUUID: UUID) {
    const res = await api_client.get(UserURLs.userFollowers(userUUID));
    return res.data.followers;
}

async function fetchUserFollowed(userUUID: UUID) {
    const res = await api_client.get(UserURLs.userFollowed(userUUID));
    return res.data.followed;
}

export function useUserFriendsQuery(userUUID: UUID | undefined) {
    return useQuery({
        queryKey: userKeys.friends(userUUID!),
        queryFn: userUUID ? () => fetchUserFriends(userUUID) : skipToken,
    });
}

export function useUserFollowersQuery(userUUID: UUID | undefined) {
    return useQuery({
        queryKey: userKeys.followers(userUUID!),
        queryFn: userUUID ? () => fetchUserFollowers(userUUID) : skipToken,
    });
}

export function useUserFollowedQuery(userUUID: UUID | undefined) {
    return useQuery({
        queryKey: userKeys.followed(userUUID!),
        queryFn: userUUID ? () => fetchUserFollowed(userUUID) : skipToken,
    });
}
