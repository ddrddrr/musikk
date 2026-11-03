import { api_client, api_client_public } from "@/api/axiosConf.ts";
import { ApiSchemas, UUID } from "@/api/types.ts";
import { UserURLs } from "@/features/user/api/endpoints.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { BaseUser, CurrentUser } from "@/features/user/types.ts";
import { skipToken, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

export async function fetchMe(): Promise<CurrentUser | null> {
    try {
        const res = await api_client_public.get<ApiSchemas["Me"]>(UserURLs.me);
        return res.data.me;
    } catch (err) {
        if (isAxiosError(err) && err.response?.status === 401) {
            return null;
        }
        throw err;
    }
}

async function fetchUser(userUUID: UUID): Promise<BaseUser> {
    const res = await api_client.get<BaseUser>(UserURLs.userRetrieve(userUUID));
    return res.data;
}

async function fetchUserFriends(userUUID: UUID): Promise<BaseUser[]> {
    const res = await api_client.get<ApiSchemas["UserFriends"]>(UserURLs.userFriends(userUUID));
    return res.data.friends;
}

async function fetchUserFollowers(userUUID: UUID): Promise<BaseUser[]> {
    const res = await api_client.get<ApiSchemas["UserFollowers"]>(UserURLs.userFollowers(userUUID));
    return res.data.followers;
}

async function fetchUserFollowed(userUUID: UUID): Promise<BaseUser[]> {
    const res = await api_client.get<ApiSchemas["UserFollowed"]>(UserURLs.userFollowed(userUUID));
    return res.data.followed;
}

export function useUserDetailQuery(userUUID: UUID) {
    return useQuery({
        queryKey: userKeys.detail(userUUID),
        queryFn: () => fetchUser(userUUID),
    });
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
