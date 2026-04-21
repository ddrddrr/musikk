import { UserChatsContext } from "@/features/publications/providers/userChatsContext.ts";
import { useContext } from "react";

export function useUserChatsContext() {
    const context = useContext(UserChatsContext);
    if (context === undefined) {
        throw new Error("useUserChatsContext must be used within a UserChatsProvider");
    }
    return context;
}
