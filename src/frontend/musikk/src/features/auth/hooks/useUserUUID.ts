import { useAuth } from "@/features/auth/hooks/useAuth.ts";

export function useUserUUID(): string {
    const { user } = useAuth();
    if (!user?.uuid) {
        throw new Error("User is not authenticated");
    }
    return user.uuid;
}
