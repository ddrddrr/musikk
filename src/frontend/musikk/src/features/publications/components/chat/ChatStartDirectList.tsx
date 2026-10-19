import { getErrorDetail } from "@/api/errorUtils.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { useCreateChat } from "@/features/publications/api/mutations.ts";
import { useMyChats } from "@/features/publications/hooks/useMyChats.ts";
import { UserCard } from "@/features/user/components/UserCard.tsx";
import { useMyConnections } from "@/features/user/hooks/useMyConnections.ts";
import { BaseUser } from "@/features/user/types.ts";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function ChatStartDirectList() {
    const userUUID = useUserUUID();
    const navigate = useNavigate();
    const { friends } = useMyConnections();
    const { chats } = useMyChats();
    const createChatMutation = useCreateChat();

    const friendsWithoutDirectChat = useMemo(() => {
        const directChatMemberUUIDs = new Set(
            chats
                .filter((chat) => chat.is_direct)
                .flatMap((chat) => chat.members.map((m) => m.uuid)),
        );

        return friends.filter((friend) => !directChatMemberUUIDs.has(friend.uuid));
    }, [friends, chats]);

    const handleFriendClick = (friend: BaseUser) => {
        if (createChatMutation.isPending) return;

        createChatMutation.mutate(
            {
                userUUID,
                participants: [friend.uuid],
                isDirect: true,
            },
            {
                onSuccess: (chat) => {
                    void navigate(`/chats/${chat.uuid}`);
                },
                onError: (error) => {
                    toast.error(getErrorDetail(error, "Failed to create a chat"));
                },
            },
        );
    };

    if (friends.length === 0) {
        return <EmptyState message="No friends to chat with yet" />;
    }

    if (friendsWithoutDirectChat.length === 0) {
        return <EmptyState message="You have chats with all your friends" />;
    }

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-muted-foreground">Start Chatting</h3>
            <div className="grid grid-cols-7 gap-1">
                {friendsWithoutDirectChat.map((friend) => (
                    <UserCard
                        key={friend.uuid}
                        user={friend}
                        size="sm"
                        onClick={handleFriendClick}
                    />
                ))}
            </div>
        </div>
    );
}
