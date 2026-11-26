import { useAuth } from "@/features/auth/hooks/useAuth.ts";
import { PostAttachment } from "@/features/publications/components/posts/PostAttachment.tsx";
import { PostHeader } from "@/features/publications/components/posts/PostHeader.tsx";
import { ReplyButton } from "@/features/publications/components/ReplyButton.tsx";
import { ReplyQuote } from "@/features/publications/components/ReplyQuote.tsx";
import { Publication } from "@/features/publications/types.ts";
import { cn } from "@/lib/utils.ts";
import { formatDateTime } from "@/utils/formatDate.ts";

interface ChatMessageProps {
    message: Publication;
    isFirstInGroup?: boolean;
    setReplyTo: (message: Publication) => void;
}

export function ChatMessage({ message, isFirstInGroup = true, setReplyTo }: ChatMessageProps) {
    const { user } = useAuth();
    const isOwnMessage = user?.uuid === message.author.uuid;
    const showHeader = !isOwnMessage && isFirstInGroup;

    return (
        <div className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "flex max-w-[70%] flex-col gap-2 overflow-hidden rounded-sm border border-foreground bg-muted p-3",
                )}
            >
                {message.parent_uuid && message.parent_author && message.parent_repr && (
                    <ReplyQuote author={message.parent_author} text={message.parent_repr} />
                )}
                {showHeader && (
                    <PostHeader author={message.author} dateAdded={message.date_added} />
                )}
                <p className="text-sm break-words text-foreground">
                    {message.is_deleted ? (
                        <span className="text-muted-foreground italic">Deleted</span>
                    ) : (
                        message.content
                    )}
                </p>
                {message.attachment && <PostAttachment attachment={message.attachment} />}
                <div className="flex items-center justify-between gap-2">
                    <ReplyButton onClick={() => setReplyTo(message)} />
                    {!showHeader && (
                        <span className="text-xs text-muted-foreground">
                            {formatDateTime(message.date_added)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
