import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { Chat } from "@/features/publications/types.ts";

export function useChatImage(chat: Chat) {
    const currentUserUUID = useUserUUID();

    const otherMember = chat.is_direct
        ? chat.members.find((m) => m.uuid !== currentUserUUID)
        : undefined;

    return {
        chatImg: chat.is_direct ? otherMember?.avatar : chat.image,
        chatImgAlt: chat.is_direct ? otherMember?.display_name : chat.title,
    };
}
