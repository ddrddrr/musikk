import { AuthContext } from "@/features/auth/providers/AuthContext.tsx";
import { useContext } from "react";

export function useUserUUID(): string | undefined {
    const auth = useContext(AuthContext);
    return auth?.user?.uuid;
}
