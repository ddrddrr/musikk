import { useUserUUID } from "@/modules/auth/hooks/useUserUUID.ts";
import { UserConnectionsContext } from "@/modules/user/providers/userConnectionsContext.tsx";
import { useUserFollowersQuery, useUserFriendsQuery } from "@/modules/user/queries.ts";
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

    return (
        <UserConnectionsContext.Provider
            value={{
                friends: friendsPending ? [] : friends,
                followed: followersPending ? [] : followers,
            }}
        >
            {children}
        </UserConnectionsContext.Provider>
    );
}
