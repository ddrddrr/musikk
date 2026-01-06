import { BaseUser } from "@/features/user/types.ts";
import { createContext } from "react";

export interface AuthContextType {
    user: BaseUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
