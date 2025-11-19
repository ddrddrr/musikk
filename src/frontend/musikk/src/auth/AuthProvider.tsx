import { login as loginAPI, logout as logoutAPI } from "@/auth/authentication";
import { AuthContext } from "@/auth/AuthContext";
import { fetchMe } from "@/components/user/queries";
import { IUser } from "@/components/user/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { ReactNode, useState } from "react";

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!Cookies.get("csrftoken"));
    const queryClient = useQueryClient();

    const {
        data: user,
        isLoading,
        refetch,
    } = useQuery<IUser | null>({
        queryKey: ["user"],
        queryFn: fetchMe,
        enabled: isAuthenticated,
        retry: false,
    });

    const login = async (email: string, password: string) => {
        await loginAPI(email, password);
        setIsAuthenticated(true);
        await refetch();
    };

    const logout = async () => {
        await logoutAPI();
        setIsAuthenticated(false);
        queryClient.setQueryData(["user"], null);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user: user ?? null,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
