import { ChatMessage } from "@/features/publications/components/chat/ChatMessage.tsx";
import { Publication } from "@/features/publications/types.ts";

interface ChatMessageListProps {
    messages: Publication[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
    if (messages.length === 0) {
        return (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                No messages yet :(
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {messages.map((message) => (
                <ChatMessage key={message.uuid} message={message} />
            ))}
        </div>
    );
}