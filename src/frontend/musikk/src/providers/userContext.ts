import { IUser } from "@/components/user/types.ts";
import { createContext } from "react";

interface UserContextType {
    user: IUser | null;
}

export const UserContext = createContext<UserContextType>({
    user: null,
});
