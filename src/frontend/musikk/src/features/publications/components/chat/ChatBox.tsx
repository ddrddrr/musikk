import { UUID } from "@/api/types.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { useChatDetail } from "@/features/publications/api/queries.ts";
import { ChatHeader } from "@/features/publications/components/chat/ChatHeader.tsx";
import { ChatMessageForm } from "@/features/publications/components/chat/ChatMessageForm.tsx";
import { ChatMessageList } from "@/features/publications/components/chat/ChatMessageList.tsx";
import { LoadOlderButton } from "@/features/publications/components/LoadOlderButton.tsx";
import { NewMessagesIndicator } from "@/features/publications/components/NewMessagesIndicator.tsx";
import { TypingIndicator } from "@/features/publications/components/TypingIndicator.tsx";
import { useAutoScrollToBottom } from "@/features/publications/hooks/useAutoScrollToBottom.ts";
import { useChatWsEvents } from "@/features/publications/hooks/useChatWsEvents.ts";
import { useNewMessagesIndicator } from "@/features/publications/hooks/useNewMessagesIndicator.ts";
import { useChatMessagesFlat } from "@/features/publications/hooks/usePublicationsInfiniteFlat.ts";
import { useScrollAnchor } from "@/features/publications/hooks/useScrollAnchor.ts";
import { useTypingIndicator } from "@/features/publications/hooks/useTypingIndicator.ts";
import { Spinner } from "@/features/ui/spinner";
import { useRef } from "react";

interface ChatBoxProps {
    chatUUID: UUID;
}

export function ChatBox({ chatUUID }: ChatBoxProps) {
    // TODO: add member count in serializer, render in header
    const userUUID = useUserUUID();
    useChatWsEvents(chatUUID);
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

    const { typers, notifyTyping } = useTypingIndicator(`chat.${chatUUID}`, "chat.typing");

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useAutoScrollToBottom(messagesEndRef, isMessagesPending, messages);
    useScrollAnchor(messagesContainerRef, isFetchingNextPage);
    const { hasNewMessages, scrollToBottom } = useNewMessagesIndicator(
        messagesContainerRef,
        messagesEndRef,
        publicationsFlat,
    );

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
        <div className="flex h-[600px] flex-col overflow-hidden rounded-sm border-2 border-foreground bg-card">
            <ChatHeader chat={chat} />

            <div className="relative min-h-0 flex-1">
                <div className="h-full overflow-y-auto p-4" ref={messagesContainerRef}>
                    <div className="mb-4 flex justify-center">
                        <LoadOlderButton
                            hasNextPage={hasNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                            fetchNextPage={fetchNextPage}
                        />
                    </div>
                    <ChatMessageList messages={publicationsFlat} />
                    <div ref={messagesEndRef} />
                </div>
                <NewMessagesIndicator visible={hasNewMessages} onClick={scrollToBottom} />
            </div>

            <TypingIndicator typers={typers} />

            <div className="border-t-2 border-foreground bg-muted p-4">
                <ChatMessageForm chat={chat} onTyping={notifyTyping} />
            </div>
        </div>
    );
}
