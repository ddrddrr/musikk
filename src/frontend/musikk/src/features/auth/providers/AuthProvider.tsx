import { authRef } from "@/api/authRef.ts";
import { login as loginAPI, logout as logoutAPI } from "@/features/auth/api.ts";
import { AuthContext } from "@/features/auth/providers/AuthContext.tsx";
import { fetchMe } from "@/features/user/api/queries.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { BaseUser } from "@/features/user/types.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { ReactNode, useCallback, useEffect, useMemo } from "react";
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
    } = useQuery<BaseUser | null>({
        queryKey: userKeys.base,
        queryFn: fetchMe,
        retry: false,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });

    const isAuthenticated = !!user && !error;

    const login = useCallback(async (email: string, password: string) => {
        await loginAPI(email, password);
        await refetch();
    }, [refetch]);

    const logout = useCallback(async () => {
        try {
            await logoutAPI();
        } catch {
            console.error("Could not reach server, logged out locally only.");
        }
        queryClient.clear();
        Cookies.remove("csrftoken");
        Cookies.remove("sessionid");
        void navigate("/login");
    }, [queryClient, navigate]);

    useEffect(() => {
        authRef.logout = logout;
        return () => {
            authRef.logout = null;
        };
    }, [logout]);

    const contextValue = useMemo(
        () => ({
            isAuthenticated,
            user: user ?? null,
            isLoading,
            login,
            logout,
        }),
        [isAuthenticated, user, isLoading, login, logout],
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}
