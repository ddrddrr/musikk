import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useUserChats } from "@/features/publications/api/queries.ts";
import { Chat } from "@/features/publications/types.ts";

const NO_CHATS: Chat[] = [];

export function useMyChats() {
    const userUUID = useUserUUID();
    const { data, isPending, error, refetch } = useUserChats(userUUID);
    return { chats: data ?? NO_CHATS, isPending, error, refetch };
}
