import { useParams } from "react-router-dom";
import { ChatBox } from "./ChatBox";

export function ChatBoxRouteHandler() {
    const { chatUUID } = useParams<{ chatUUID: string }>();
    if (!chatUUID) return null;
    return <ChatBox chatUUID={chatUUID} />;
}
