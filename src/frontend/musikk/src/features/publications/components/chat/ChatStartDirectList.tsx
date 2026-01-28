import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useCreateChat } from "@/features/publications/api/mutations.ts";
import { useUserChatsContext } from "@/features/publications/hooks/useUserChats.ts";
import { UserCard } from "@/features/user/components/UserCard.tsx";
import { UserConnectionsContext } from "@/features/user/providers/userConnectionsContext.tsx";
import { BaseUser } from "@/features/user/types.ts";
import { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export function ChatStartDirectList() {
    const userUUID = useUserUUID();
    const navigate = useNavigate();
    const { friends } = useContext(UserConnectionsContext);
    const { chats } = useUserChatsContext();
    const createChatMutation = useCreateChat();

    const friendsWithoutDirectChat = useMemo(() => {
        // TODO add a hook for chats so we dont check for null here
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
                    console.error("Failed to create direct chat:", error);
                },
            },
        );
    };

    if (!friends || friends.length === 0) {
        return (
            <div className="rounded-sm border-2 border-black bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-600">
                    Chats will appear, when you have some friends :)
                </p>
            </div>
        );
    }

    if (!friendsWithoutDirectChat || friendsWithoutDirectChat.length === 0) {
        return (
            <div className="rounded-sm border-2 border-black bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-600">
                    You have direct chats with all your friends!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-600">Start Chatting</h3>
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
