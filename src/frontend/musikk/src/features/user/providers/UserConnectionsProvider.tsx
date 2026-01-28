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
    const { isPending: friendsPending, data: friends } = useUserFriendsQuery(userUUID, !!userUUID);
    const { isPending: followersPending, data: followers } = useUserFollowersQuery(
        userUUID,
        !!userUUID,
    );
    const { isPending: followedPending, data: followed } = useUserFollowedQuery(
        userUUID,
        !!userUUID,
    );

    return (
        <UserConnectionsContext.Provider
            value={{
                friends: friendsPending ? [] : friends,
                followers: followersPending ? [] : followers,
                followed: followedPending ? [] : followed,
            }}
        >
            {children}
        </UserConnectionsContext.Provider>
    );
}
