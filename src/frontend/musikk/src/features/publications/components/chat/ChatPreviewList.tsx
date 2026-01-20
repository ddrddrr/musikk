import { ChatNewGroupForm } from "@/features/publications/components/chat/ChatNewGroupForm.tsx";
import { ChatPreview } from "@/features/publications/components/chat/ChatPreview.tsx";
import { useUserChatsContext } from "@/features/publications/hooks/useUserChats.ts";
import { Button } from "@/features/ui/button.tsx";
import { Plus } from "lucide-react";
import { useState } from "react";

export function ChatPreviewList() {
    const { chats, isLoading } = useUserChatsContext();
    const [showNewGroupForm, setShowNewGroupForm] = useState(false);

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-sm border-2 border-black border-t-transparent"></div>
            </div>
        );
    }

    if (showNewGroupForm) {
        return (
            <ChatNewGroupForm
                onSuccess={() => setShowNewGroupForm(false)}
                onCancel={() => setShowNewGroupForm(false)}
            />
        );
    }

    // TODO: add a new component that will render the user avatars + names, when clicked will call api
    // to create new chat and open the newly created chat

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Chats</h2>
                <Button variant="brand" size="sm" onClick={() => setShowNewGroupForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Group
                </Button>
            </div>

            <div className="space-y-2">
                {chats && chats.map((chat) => <ChatPreview key={chat.uuid} chat={chat} />)}
            </div>
        </div>
    );
}
