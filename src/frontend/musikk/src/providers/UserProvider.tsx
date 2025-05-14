import { IJWTPayload } from "@/components/signup-login/types.ts";
import { fetchUser } from "@/components/user/queries.ts";
import { useUserUUID } from "@/hooks/useUserUUID.ts";
import { UserContext } from "@/providers/userContext.ts";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { ReactNode } from "react";

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
    const userUUID = useUserUUID();

    const { data } = useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            const accessToken = Cookies.get("access");
            if (!accessToken) {
                return undefined;
            }
            const decodedToken = jwtDecode<IJWTPayload>(accessToken);
            const res = await fetchUser(decodedToken.uuid);
            return res;
        },
        enabled: !!userUUID,
    });

    return <UserContext.Provider value={{ user: data }}>{children}</UserContext.Provider>;
};
