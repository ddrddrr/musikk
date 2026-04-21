import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useChatImage } from "@/features/publications/hooks/useChatImage.ts";
import { Chat } from "@/features/publications/types.ts";
import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
import { cn } from "@/lib/utils.ts";
import { formatDateTime } from "@/utils/formatDate.ts";
import { useNavigate } from "react-router-dom";

interface ChatPreviewProps {
    chat: Chat;
}

export function ChatPreview({ chat }: ChatPreviewProps) {
    const userUUID = useUserUUID();
    const navigate = useNavigate();
    const { chatImg, chatImgAlt } = useChatImage(chat);

    const lastMessageTime = chat.last_message ? formatDateTime(chat.last_message.date_added) : null;

    return (
        <button
            onClick={() => void navigate(`/users/${userUUID}/chats/${chat.uuid}`)}
            className={cn(
                "w-full rounded-sm border-2 border-foreground p-3 text-left transition-colors",
                chat.is_read ? "bg-card hover:bg-muted" : "bg-card font-bold hover:bg-muted",
            )}
        >
            <div className="flex items-start gap-3">
                <UserAvatar src={chatImg} alt={chatImgAlt} size="sm" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                        <h3 className="truncate text-sm font-bold">{chat.title}</h3>
                        {lastMessageTime && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {lastMessageTime}
                            </span>
                        )}
                    </div>
                    {chat.last_message && (
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                            {chat.last_message.is_deleted ? (
                                <span className="italic">Message deleted</span>
                            ) : (
                                <>
                                    <span className="font-medium">
                                        {chat.last_message.author.uuid === userUUID
                                            ? "You"
                                            : chat.last_message.author.display_name}
                                        :
                                    </span>{" "}
                                    {chat.last_message.content}
                                </>
                            )}
                        </p>
                    )}
                </div>
            </div>
        </button>
    );
}
