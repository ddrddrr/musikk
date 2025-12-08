import { IUser } from "@/modules/user/types.ts";
import { createContext } from "react";

interface UserConnectionsContextProps {
    friends: IUser[];
    followed: IUser[];
}

export const UserConnectionsContext = createContext<UserConnectionsContextProps>({
    friends: [],
    followed: [],
});
