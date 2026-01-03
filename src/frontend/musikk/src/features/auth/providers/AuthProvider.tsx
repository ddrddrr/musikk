import { login as loginAPI, logout as logoutAPI } from "@/features/auth/api.ts";
import { AuthContext } from "@/features/auth/providers/AuthContext.tsx";
import { fetchMe } from "@/features/user/queries.ts";
import { IUser } from "@/features/user/types.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        data: user,
        isLoading,
        refetch,
        error,
    } = useQuery<IUser | null>({
        queryKey: ["user"],
        queryFn: fetchMe,
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });

    const isAuthenticated = !!user && !error;

    const login = async (email: string, password: string) => {
        await loginAPI(email, password);
        await refetch();
    };

    const logout = async () => {
        await logoutAPI();
        queryClient.clear();
        if (Cookies.get("csrftoken")) Cookies.remove("csrftoken");
        navigate("/login");
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
