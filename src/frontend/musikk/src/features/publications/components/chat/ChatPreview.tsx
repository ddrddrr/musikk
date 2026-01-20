import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { Chat } from "@/features/publications/types.ts";
import { cn } from "@/lib/utils.ts";
import { useNavigate } from "react-router-dom";

interface ChatPreviewProps {
    chat: Chat;
}

export function ChatPreview({ chat }: ChatPreviewProps) {
    const userUUID = useUserUUID();
    const navigate = useNavigate();
    return (
        // TODO: proper button
        <button
            onClick={() => void navigate(`/users/${userUUID}/chats/${chat.uuid}`)}
            className={cn(
                "w-full rounded-sm border-2 border-black bg-white p-3 text-left transition-colors hover:bg-gray-50",
                !chat.is_read && "font-bold",
            )}
        >
            <div className="flex items-center gap-3">
                {chat.image && (
                    <img
                        src={chat.image}
                        className="h-12 w-12 rounded-sm border-2 border-black object-cover"
                    />
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                        <h3 className="truncate text-sm font-bold">{chat.title}</h3>
                        {chat.last_message && (
                            <span className="shrink-0 text-[10px] text-gray-600">
                                {new Date(chat.last_message.date_added).toLocaleString(undefined, {
                                    dateStyle: "short",
                                })}
                            </span>
                        )}
                    </div>
                    {chat.last_message && (
                        <p className="truncate text-xs text-gray-600">
                            {/*TODO: show last not deleted...*/}
                            {!chat.last_message.is_deleted ? (
                                <span className="italic">Message deleted</span>
                            ) : (
                                <>
                                    <span className="font-medium">
                                        {chat.last_message.author.display_name}:
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
