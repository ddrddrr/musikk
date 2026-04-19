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
                    "flex max-w-[70%] flex-col gap-2 overflow-hidden rounded-sm border border-foreground p-3",
                    "bg-muted",
                )}
            >
                {showHeader && (
                    <PostHeader author={message.author} dateAdded={message.date_added} />
                )}
                <p className="break-words text-sm text-foreground">
                    {message.is_deleted ? (
                        <span className="text-muted-foreground italic">Deleted</span>
                    ) : (
                        message.content
                    )}
                </p>
                {message.attachment && <PostAttachment attachment={message.attachment} />}
                {!showHeader && (
                    <span className="block text-right text-xs text-muted-foreground">
                        {formatDateTime(message.date_added)}
                    </span>
                )}
            </div>
        </div>
    );
}
