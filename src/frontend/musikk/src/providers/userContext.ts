import { createContext } from "react";
import { IUser } from "@/components/user/types.ts";

interface UserContextType {
    user: IUser | null;
    setUser: (user: IUser | null) => void;
}

export const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => {},
});
