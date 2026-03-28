import { AuthContext } from "@/features/auth/providers/AuthContext.tsx";
import { useContext } from "react";

export function useUserUUID(): string {
    const auth = useContext(AuthContext);
    if (!auth?.user?.uuid) {
        throw new Error("User is not authenticated");
    }
    return auth.user.uuid;
}
