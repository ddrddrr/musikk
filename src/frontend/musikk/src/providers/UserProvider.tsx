import { fetchMe } from "@/components/user/queries.ts";
import { IUser } from "@/components/user/types.ts";
import { UserContext } from "@/providers/userContext.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { ReactNode, useEffect } from "react";

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
    const queryClient = useQueryClient();

    const { data, refetch } = useQuery<IUser | null>({
        queryKey: ["user"],
        queryFn: () => fetchMe(),
        enabled: false,
        retry: false,
    });

    useEffect(() => {
        const handler = () => {
            if (Cookies.get("csrftoken")) {
                refetch();
            }
        };
        window.addEventListener("auth-updated", handler);
        return () => window.removeEventListener("auth-updated", handler);
    }, [refetch, queryClient]);

    return <UserContext.Provider value={{ user: data ?? null }}>{children}</UserContext.Provider>;
};
