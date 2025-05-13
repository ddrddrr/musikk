import { useUserFollowedQuery, useUserFriendsQuery } from "@/components/user/queries.ts";
import { UserConnectionsContext } from "@/providers/userConnectionsContext.tsx";
import { UserContext } from "@/providers/userContext.ts";
import { ReactNode, useContext } from "react";

interface UserConnectionsProviderProps {
    children: ReactNode;
}

export function UserConnectionsProvider({ children }: UserConnectionsProviderProps) {
    const { user } = useContext(UserContext);
    const { isPending: friendsPending, data: friends } = useUserFriendsQuery(user?.uuid, !!user?.uuid);
    const { isPending: followedPending, data: followed } = useUserFollowedQuery(user?.uuid, !!user?.uuid);

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
