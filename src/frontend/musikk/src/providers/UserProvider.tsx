import { IUser } from "@/components/login/types.ts";
import { UserContext } from "@/providers/userContext.ts";
import { ReactNode, useState } from "react";

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
    const [user, setUser] = useState<IUser | null>(() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const updateUser = (newUser: IUser | null) => {
        setUser(newUser);
        if (newUser) {
            localStorage.setItem("user", JSON.stringify(newUser));
        } else {
            localStorage.removeItem("user");
        }
    };

    return <UserContext.Provider value={{ user, setUser: updateUser }}>{children}</UserContext.Provider>;
};
