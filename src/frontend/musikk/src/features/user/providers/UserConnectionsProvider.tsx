import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import {
    useUserFollowedQuery,
    useUserFollowersQuery,
    useUserFriendsQuery,
} from "@/features/user/api/queries.ts";
import { UserConnectionsContext } from "@/features/user/providers/userConnectionsContext.tsx";
import { ReactNode, useMemo } from "react";

interface UserConnectionsProviderProps {
    children: ReactNode;
}

export function UserConnectionsProvider({ children }: UserConnectionsProviderProps) {
    const userUUID = useUserUUID();
    const {
        isPending: friendsPending,
        data: friends,
        error: friendsError,
    } = useUserFriendsQuery(userUUID);
    const {
        isPending: followersPending,
        data: followers,
        error: followersError,
    } = useUserFollowersQuery(userUUID);
    const {
        isPending: followedPending,
        data: followed,
        error: followedError,
    } = useUserFollowedQuery(userUUID);

    const isLoading = friendsPending || followersPending || followedPending;
    const error = friendsError ?? followersError ?? followedError ?? null;

    const contextValue = useMemo(
        () => ({
            friends: friends ?? [],
            followers: followers ?? [],
            followed: followed ?? [],
            error,
            isLoading,
        }),
        [friends, followers, followed, error, isLoading],
    );

    return (
        <UserConnectionsContext.Provider value={contextValue}>
            {children}
        </UserConnectionsContext.Provider>
    );
}
