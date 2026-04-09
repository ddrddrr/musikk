import { getErrorDetail } from "@/api/errorUtils.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useCreateChat } from "@/features/publications/api/mutations.ts";
import { useUserChatsContext } from "@/features/publications/hooks/useUserChats.ts";
import { UserCard } from "@/features/user/components/UserCard.tsx";
import { UserConnectionsContext } from "@/features/user/providers/userConnectionsContext.tsx";
import { BaseUser } from "@/features/user/types.ts";
import { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function ChatStartDirectList() {
    const userUUID = useUserUUID();
    const navigate = useNavigate();
    const { friends } = useContext(UserConnectionsContext);
    const { chats } = useUserChatsContext();
    const createChatMutation = useCreateChat();

    const friendsWithoutDirectChat = useMemo(() => {
        // TODO add a hook for chats so we dont check for null here?
        if (!friends || !chats) return [];

        const directChatMemberUUIDs = new Set(
            chats
                .filter((chat) => chat.is_direct)
                .flatMap((chat) => chat.members.map((m) => m.uuid)),
        );

        return friends.filter((friend) => !directChatMemberUUIDs.has(friend.uuid));
    }, [friends, chats]);

    const handleFriendClick = (friend: BaseUser) => {
        if (!userUUID || createChatMutation.isPending) return;

        createChatMutation.mutate(
            {
                userUUID,
                participants: [friend.uuid],
                isDirect: true,
            },
            {
                onSuccess: (chat) => {
                    void navigate(`/users/${userUUID}/chats/${chat.uuid}`);
                },
                onError: (error) => {
                    toast.error(getErrorDetail(error, "Failed to create a chat"));
                },
            },
        );
    };

    if (!friends || friends.length === 0) {
        return (
            <div className="rounded-sm border-2 border-foreground bg-muted p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Chats will appear, when you have some friends :)
                </p>
            </div>
        );
    }

    if (!friendsWithoutDirectChat || friendsWithoutDirectChat.length === 0) {
        return (
            <div className="rounded-sm border-2 border-foreground bg-muted p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    You have chats with all of your friends!
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-muted-foreground">Start Chatting</h3>
            <div className="grid grid-cols-7 gap-1">
                {friendsWithoutDirectChat.map((friend) => (
                    <UserCard
                        key={friend.uuid}
                        user={friend}
                        size="small"
                        onClick={handleFriendClick}
                    />
                ))}
            </div>
        </div>
    );
}
