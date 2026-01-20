import { Chat } from "@/features/publications/types.ts";
import { createContext } from "react";

interface UserChatsContextType {
    chats: Chat[] | null;
    isLoading: boolean;
}

export const UserChatsContext = createContext<UserChatsContextType>({
    chats: null,
    isLoading: false,
});
