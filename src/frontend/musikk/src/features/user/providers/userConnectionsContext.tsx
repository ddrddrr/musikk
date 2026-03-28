import { BaseUser } from "@/features/user/types.ts";
import { createContext } from "react";

interface UserConnectionsContextProps {
    friends: BaseUser[];
    followers: BaseUser[];
    followed: BaseUser[];
    error: Error | null;
    isLoading: boolean;
}

export const UserConnectionsContext = createContext<UserConnectionsContextProps>({
    friends: [],
    followers: [],
    followed: [],
    error: null,
    isLoading: false,
});
