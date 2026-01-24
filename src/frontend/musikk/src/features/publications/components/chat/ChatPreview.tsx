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
        <button
            onClick={() => void navigate(`/users/${userUUID}/chats/${chat.uuid}`)}
            className={cn(
                "w-full rounded-sm border-2 border-black bg-white p-3 text-left transition-colors hover:bg-gray-50",
                !chat.is_read && "font-bold",
            )}
        >
            <div className="flex items-start gap-3">
                {chat.image && (
                    <img
                        src={chat.image}
                        className="h-12 w-12 flex-shrink-0 rounded-sm border-2 border-black object-cover"
                    />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="truncate text-sm font-bold">
                        {chat.title}
                        {!chat.is_direct && (
                            <span className="ml-2 text-xs font-normal text-gray-600">
                                {chat.members.length} members
                            </span>
                        )}
                    </h3>
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
                                {new Date(chat.last_message.date_added).toLocaleString(undefined, {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                })}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </button>
    );
}
