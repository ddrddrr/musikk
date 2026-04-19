import { ChatMessage } from "@/features/publications/components/chat/ChatMessage.tsx";
import { Publication } from "@/features/publications/types.ts";
import { formatDate, isSameDay } from "@/utils/formatDate.ts";

interface ChatMessageListProps {
    messages: Publication[];
}

// move if reused in the future
function DateSeparator({ date }: { date: string }) {
    return (
        <div className="flex items-center gap-3 py-3">
            <div className="h-[2px] flex-1 bg-foreground" />
            <span className="shrink-0 text-xs font-bold text-muted-foreground">
                {formatDate(date)}
            </span>
            <div className="h-[2px] flex-1 bg-foreground" />
        </div>
    );
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
    if (messages.length === 0) {
        return (
            <div className="rounded-sm border-2 border-foreground bg-muted p-6 text-center">
                <p className="text-sm text-muted-foreground">No messages yet :(</p>
            </div>
        );
    }

    return (
        <div>
            {messages.map((message, index) => {
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const sameSender = prevMessage !== null && prevMessage.author.uuid === message.author.uuid;
                const sameDay = prevMessage !== null && isSameDay(prevMessage.date_added, message.date_added);
                const isFirstInGroup = !sameSender || !sameDay;
                const showDateSeparator = prevMessage !== null && !sameDay;

                return (
                    <div
                        key={message.uuid}
                        className={index === 0 ? "" : isFirstInGroup ? "mt-3" : "mt-0.5"}
                    >
                        {showDateSeparator && <DateSeparator date={message.date_added} />}
                        <ChatMessage message={message} isFirstInGroup={isFirstInGroup} />
                    </div>
                );
            })}
        </div>
    );
}