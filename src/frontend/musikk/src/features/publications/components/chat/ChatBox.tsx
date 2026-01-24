import { UUID } from "@/api/types.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useChatDetail } from "@/features/publications/api/queries.ts";
import { LoadOlderButton } from "@/features/publications/components/LoadOlderButton.tsx";
import { ChatHeader } from "@/features/publications/components/chat/ChatHeader.tsx";
import { ChatMessageForm } from "@/features/publications/components/chat/ChatMessageForm.tsx";
import { ChatMessageList } from "@/features/publications/components/chat/ChatMessageList.tsx";
import { useAutoScrollToBottom } from "@/features/publications/hooks/useAutoScrollToBottom.ts";
import { useChatMessagesFlat } from "@/features/publications/hooks/usePublicationsInfiniteFlat.ts";
import { Button } from "@/features/ui/button.tsx";
import { useRef } from "react";

interface ChatBoxProps {
    chatUUID: UUID;
}

export function ChatBox({ chatUUID }: ChatBoxProps) {
    // TODO: add member count in serializer, render in header
    const userUUID = useUserUUID();
    const {
        data: chat,
        error: chatError,
        isPending: isChatPending,
        refetch: refetchChat,
    } = useChatDetail(userUUID!, chatUUID);

    const {
        data: messages,
        error,
        isPending,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        refetch,
        publicationsFlat,
    } = useChatMessagesFlat(userUUID!, chatUUID);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = useAutoScrollToBottom(messagesContainerRef, isPending, messages);

    // TODO: use common spinner
    if (isChatPending || isPending) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-sm border-2 border-black border-t-transparent"></div>
            </div>
        );
    }

    if (chatError) {
        return (
            <div className="rounded-sm border-2 border-black bg-red-600 p-4 text-white">
                <div className="text-sm font-medium">Failed to load chat</div>
                <Button variant="brand" size="lg" onClick={() => void refetchChat()}>
                    Retry
                </Button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-sm border-2 border-black bg-red-600 p-4 text-white">
                <div className="text-sm font-medium">Failed to load messages</div>
                <Button variant="brand" size="lg" onClick={() => void refetch}>
                    Retry
                </Button>
            </div>
        );
    }

    if (!chat) {
        return null;
    }

    return (
        <div className="flex h-full max-h-[600px] flex-col overflow-hidden rounded-sm border-2 border-black bg-white">
            <ChatHeader chat={chat} />

            <div className="min-h-0 flex-1 overflow-y-auto p-4" ref={messagesContainerRef}>
                <div className="mb-4 flex justify-center">
                    <LoadOlderButton
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        fetchNextPage={fetchNextPage}
                    />
                </div>
                <ChatMessageList messages={publicationsFlat} />
            </div>

            <div className="border-t-2 border-black bg-gray-100 p-4">
                <ChatMessageForm chat={chat} onMessagePosted={scrollToBottom} />
            </div>
        </div>
    );
}
