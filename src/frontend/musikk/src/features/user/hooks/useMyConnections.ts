import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import {
    useUserFollowedQuery,
    useUserFollowersQuery,
    useUserFriendsQuery,
} from "@/features/user/api/queries.ts";
import { BaseUser } from "@/features/user/types.ts";

const NO_USERS: BaseUser[] = [];

export function useMyConnections() {
    const userUUID = useUserUUID();
    const friendsQuery = useUserFriendsQuery(userUUID);
    const followersQuery = useUserFollowersQuery(userUUID);
    const followedQuery = useUserFollowedQuery(userUUID);

    return {
        friends: friendsQuery.data ?? NO_USERS,
        followers: followersQuery.data ?? NO_USERS,
        followed: followedQuery.data ?? NO_USERS,
        isPending: friendsQuery.isPending || followersQuery.isPending || followedQuery.isPending,
        error: friendsQuery.error ?? followersQuery.error ?? followedQuery.error,
    };
}
