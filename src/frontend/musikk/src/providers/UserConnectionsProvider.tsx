import { useUserUUID } from "@/modules/auth/hooks/useUserUUID.ts";
import { useUserFollowedQuery, useUserFriendsQuery } from "@/modules/user/queries.ts";
import { UserConnectionsContext } from "@/providers/userConnectionsContext.tsx";
import { ReactNode } from "react";

interface UserConnectionsProviderProps {
    children: ReactNode;
}

export function UserConnectionsProvider({ children }: UserConnectionsProviderProps) {
    const userUUID = useUserUUID();
    const { isPending: friendsPending, data: friends } = useUserFriendsQuery(userUUID, !!userUUID);
    const { isPending: followedPending, data: followed } = useUserFollowedQuery(
        userUUID,
        !!userUUID,
    );

    return (
        <UserConnectionsContext.Provider
            value={{
                friends: friendsPending ? [] : friends,
                followed: followedPending ? [] : followed,
            }}
        >
            {children}
        </UserConnectionsContext.Provider>
    );
}
