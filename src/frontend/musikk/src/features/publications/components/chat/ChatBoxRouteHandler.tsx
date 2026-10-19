import { BackButton } from "@/features/common/BackButton.tsx";
import { ChatBox } from "@/features/publications/components/chat/ChatBox.tsx";
import { useParams } from "react-router-dom";

export function ChatBoxRouteHandler() {
    const { chatUUID } = useParams<{ chatUUID: string }>();
    if (!chatUUID) return null;
    return (
        <div className="flex flex-col p-4">
            <BackButton />
            <ChatBox chatUUID={chatUUID} />
        </div>
    );
}
