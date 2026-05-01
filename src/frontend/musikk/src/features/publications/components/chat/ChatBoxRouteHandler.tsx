import { BackButton } from "@/features/common/BackButton.tsx";
import { useParams } from "react-router-dom";
import { ChatBox } from "./ChatBox";

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
