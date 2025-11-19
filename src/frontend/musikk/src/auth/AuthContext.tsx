import { IUser } from "@/components/user/types.ts";
import { createContext } from "react";

export interface AuthContextType {
    isAuthenticated: boolean;
    user: IUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
