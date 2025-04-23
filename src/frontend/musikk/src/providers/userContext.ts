import { IUser } from "@/components/login/types.ts";
import { createContext } from "react";

interface UserContextType {
    user: IUser | null;
    setUser: (user: IUser | null) => void;
}

export const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => {},
});
