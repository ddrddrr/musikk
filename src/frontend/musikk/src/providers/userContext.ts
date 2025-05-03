import { IUser } from "@/components/user/types.ts";
import { createContext } from "react";

interface UserContextType {
    user: IUser | undefined;
}

export const UserContext = createContext<UserContextType>({
    user: undefined,
});
