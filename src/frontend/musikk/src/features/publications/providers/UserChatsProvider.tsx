import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useUserChats } from "@/features/publications/api/queries.ts";
import { UserChatsContext } from "@/features/publications/providers/userChatsContext.ts";
import { ReactNode } from "react";
type UserChatsProviderProps = {
    children: ReactNode;
};
export function UserChatsProvider({ children }: UserChatsProviderProps) {
    const userUUID = useUserUUID();
    const { data, isLoading, error, refetch } = useUserChats(userUUID!);

    const contextValue = {
        chats: data ?? null,
        isLoading,
        error: error ?? null,
        refetch: () => void refetch(),
    };

    return <UserChatsContext value={contextValue}>{children}</UserChatsContext>;
}
