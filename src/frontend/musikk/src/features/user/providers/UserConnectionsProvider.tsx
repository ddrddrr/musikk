import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { UserConnectionsContext } from "@/features/user/providers/userConnectionsContext.tsx";
import {
    useUserFollowedQuery,
    useUserFollowersQuery,
    useUserFriendsQuery,
} from "@/features/user/api/queries.ts";
import { ReactNode } from "react";

interface UserConnectionsProviderProps {
    children: ReactNode;
}

export function UserConnectionsProvider({ children }: UserConnectionsProviderProps) {
    const userUUID = useUserUUID();
    const {
        isPending: friendsPending,
        data: friends,
        error: friendsError,
    } = useUserFriendsQuery(userUUID, !!userUUID);
    const {
        isPending: followersPending,
        data: followers,
        error: followersError,
    } = useUserFollowersQuery(userUUID, !!userUUID);
    const {
        isPending: followedPending,
        data: followed,
        error: followedError,
    } = useUserFollowedQuery(userUUID, !!userUUID);

    const isLoading = friendsPending || followersPending || followedPending;
    const error = friendsError ?? followersError ?? followedError ?? null;

    return (
        <UserConnectionsContext.Provider
            value={{
                friends: friendsPending ? [] : friends,
                followers: followersPending ? [] : followers,
                followed: followedPending ? [] : followed,
                error,
                isLoading,
            }}
        >
            {children}
        </UserConnectionsContext.Provider>
    );
}
