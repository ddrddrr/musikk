import { api_client, api_client_public } from "@/api/axiosConf.ts";
import { UUID } from "@/api/types.ts";
import { UserURLs } from "@/features/user/api/endpoints.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { BaseUser, CurrentUser } from "@/features/user/types.ts";
import { skipToken, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

interface MeResponse {
    me: CurrentUser;
}

interface FriendsResponse {
    friends: BaseUser[];
}

interface FollowersResponse {
    followers: BaseUser[];
}

interface FollowedResponse {
    followed: BaseUser[];
}

export async function fetchMe(): Promise<CurrentUser | null> {
    try {
        const res = await api_client_public.get<MeResponse>(UserURLs.me);
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
    const res = await api_client.get<FriendsResponse>(UserURLs.userFriends(userUUID));
    return res.data.friends;
}

async function fetchUserFollowers(userUUID: UUID): Promise<BaseUser[]> {
    const res = await api_client.get<FollowersResponse>(UserURLs.userFollowers(userUUID));
    return res.data.followers;
}

async function fetchUserFollowed(userUUID: UUID): Promise<BaseUser[]> {
    const res = await api_client.get<FollowedResponse>(UserURLs.userFollowed(userUUID));
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
