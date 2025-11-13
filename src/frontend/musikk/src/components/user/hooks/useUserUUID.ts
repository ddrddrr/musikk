import { UserContext } from "@/providers/userContext.ts";
import { useContext } from "react";

export function useUserUUID(): string | undefined {
    const { user } = useContext(UserContext);
    return user?.uuid;
}
