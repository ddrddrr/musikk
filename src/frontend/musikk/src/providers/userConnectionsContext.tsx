import { IUserBaseProfile } from "@/modules/user/types.ts";
import { createContext } from "react";

interface UserConnectionsContextProps {
    friends: IUserBaseProfile[];
    followed: IUserBaseProfile[];
}

export const UserConnectionsContext = createContext<UserConnectionsContextProps>({
    friends: [],
    followed: [],
});
