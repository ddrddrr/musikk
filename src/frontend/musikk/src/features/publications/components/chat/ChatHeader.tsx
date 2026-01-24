import { Chat } from "@/features/publications/types.ts";

interface ChatHeaderProps {
    chat: Chat;
}

export function ChatHeader({ chat }: ChatHeaderProps) {
    return (
        <div className="border-b-2 border-black bg-gray-100 p-4">
            <div className="flex items-center gap-3">
                {chat.image && (
                    <img
                        src={chat.image}
                        className="h-10 w-10 rounded-sm border-2 border-black object-cover"
                    />
                )}
                <div>
                    <h2 className="text-lg font-bold">{chat.title}</h2>
                </div>
            </div>
        </div>
    );
}
