import { Publication } from "@/features/publications/types.ts";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";
import { useAuth } from "@/hooks/useAuth.ts";
import { cn } from "@/lib/utils.ts";

interface ChatMessageProps {
    message: Publication;
}

export function ChatMessage({ message }: ChatMessageProps) {
    // TODO use useruuid instead?
    const { user } = useAuth();
    const isOwnMessage = user?.uuid === message.author.uuid;

    return (
        <div className={cn("mb-3 flex", isOwnMessage ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[70%] rounded-sm border-2 border-black p-3",
                    isOwnMessage ? "bg-blue-100" : "bg-gray-50",
                )}
            >
                {!isOwnMessage && (
                    <div className="mb-1">
                        <UserIdentifier user={message.author} />
                    </div>
                )}
                {/*TODO dont render if deleted*/}
                <p className="text-sm text-gray-800">
                    {message.is_deleted ? (
                        <span className="text-gray-400 italic">Deleted</span>
                    ) : (
                        message.content
                    )}
                </p>
                <span className="mt-1 block text-right text-[10px] text-gray-600">
                    {new Date(message.date_added).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })}
                </span>
            </div>
        </div>
    );
}
