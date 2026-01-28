import { AuthContext } from "@/features/auth/providers/AuthContext.tsx";
import { useContext } from "react";

export function useUserUUID(): string | undefined {
    // TODO: raise err if not available? so we don't need to handle undefined everywhere this is used
    const auth = useContext(AuthContext);
    return auth?.user?.uuid;
}
