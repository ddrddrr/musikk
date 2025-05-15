import { fetchUser } from "@/components/user/queries.ts";
import { useUserUUID } from "@/hooks/useUserUUID.ts";
import { UserContext } from "@/providers/userContext.ts";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
    const userUUID = useUserUUID();

    const { data } = useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            if (!userUUID) {
                return undefined;
            }
            return await fetchUser(userUUID);
        },
        enabled: !!userUUID,
    });

    return <UserContext.Provider value={{ user: data }}>{children}</UserContext.Provider>;
};
