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

    return (
        <button
            onClick={() => void navigate(`/users/${userUUID}/chats/${chat.uuid}`)}
            className={cn(
                "w-full rounded-sm border-2 border-black bg-white p-3 text-left transition-colors hover:bg-gray-50",
                !chat.is_read && "font-bold",
            )}
        >
            <div className="flex items-start gap-3">
                <UserAvatar src={chatImg} alt={chatImgAlt} size="sm" />
                <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="truncate text-base font-bold">{chat.title}</h3>
                    {chat.last_message && (
                        <>
                            <p className="truncate text-xs text-gray-600">
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
                            <p className="text-[10px] text-gray-600">
                                {formatDateTime(chat.last_message.date_added)}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </button>
    );
}
