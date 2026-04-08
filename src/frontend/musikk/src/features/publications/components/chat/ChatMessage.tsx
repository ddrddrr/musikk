import { PostAttachment } from "@/features/publications/components/posts/PostAttachment.tsx";
import { PostHeader } from "@/features/publications/components/posts/PostHeader.tsx";
import { Publication } from "@/features/publications/types.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { cn } from "@/lib/utils.ts";
import { formatDateTime } from "@/utils/formatDate.ts";

interface ChatMessageProps {
    message: Publication;
    isFirstInGroup?: boolean;
}

export function ChatMessage({ message, isFirstInGroup = true }: ChatMessageProps) {
    const { user } = useAuth();
    const isOwnMessage = user?.uuid === message.author.uuid;
    const showHeader = !isOwnMessage && isFirstInGroup;

    return (
        <div className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[70%] rounded-sm border border-black p-3",
                    isOwnMessage ? "bg-blue-100" : "bg-gray-50",
                )}
            >
                {showHeader && (
                    <div className="mb-1">
                        <PostHeader author={message.author} dateAdded={message.date_added} />
                    </div>
                )}
                <p className="break-words text-sm text-gray-800">
                    {message.is_deleted ? (
                        <span className="text-gray-400 italic">Deleted</span>
                    ) : (
                        message.content
                    )}
                </p>
                {message.attachment && <PostAttachment attachment={message.attachment} />}
                {!showHeader && (
                    <span className="mt-1 block text-right text-xs text-muted-foreground">
                        {formatDateTime(message.date_added)}
                    </span>
                )}
            </div>
        </div>
    );
}
