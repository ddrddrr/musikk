import { fetchUser } from "@/components/user/queries.ts";
import { useUserUUID } from "@/components/user/hooks/useUserUUID.ts";
import { UserContext } from "@/providers/userContext.ts";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
    const userUUID = useUserUUID();

    const { data } = useQuery({
        queryKey: ["user", userUUID],
        queryFn: () => (userUUID ? fetchUser(userUUID) : Promise.resolve(undefined)),
        enabled: !!userUUID,
    });

    return <UserContext.Provider value={{ user: data }}>{children}</UserContext.Provider>;
};
