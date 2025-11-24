import { IUserBaseProfile } from "@/modules/user/types.ts";
import { createContext } from "react";

export interface AuthContextType {
    user: IUserBaseProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
