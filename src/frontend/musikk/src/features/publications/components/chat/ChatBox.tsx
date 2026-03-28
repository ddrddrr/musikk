import { UUID } from "@/api/types.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { Spinner } from "@/components/ui/spinner";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { useChatDetail } from "@/features/publications/api/queries.ts";
import { LoadOlderButton } from "@/features/publications/components/LoadOlderButton.tsx";
import { ChatHeader } from "@/features/publications/components/chat/ChatHeader.tsx";
import { ChatMessageForm } from "@/features/publications/components/chat/ChatMessageForm.tsx";
import { ChatMessageList } from "@/features/publications/components/chat/ChatMessageList.tsx";
import { useAutoScrollToBottom } from "@/features/publications/hooks/useAutoScrollToBottom.ts";
import { useChatMessagesFlat } from "@/features/publications/hooks/usePublicationsInfiniteFlat.ts";
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
    } = useChatDetail(userUUID, chatUUID);

    const {
        data: messages,
        error: messagesError,
        isPending: isMessagesPending,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        publicationsFlat,
        refetch: refetchMessages,
    } = useChatMessagesFlat(userUUID, chatUUID);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = useAutoScrollToBottom(messagesContainerRef, isMessagesPending, messages);

    if (isChatPending || isMessagesPending) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (chatError) {
        return <QueryErrorBox message="Failed to load chat" onRetry={() => void refetchChat()} />;
    }
    if (messagesError) {
        return (
            <QueryErrorBox
                message="Failed to load messages"
                onRetry={() => void refetchMessages()}
            />
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
                {/*TODO: add ws to load messages on new pub*/}
                <ChatMessageList messages={publicationsFlat} />
            </div>

            <div className="border-t-2 border-black bg-gray-100 p-4">
                <ChatMessageForm chat={chat} onMessagePosted={scrollToBottom} />
            </div>
        </div>
    );
}
