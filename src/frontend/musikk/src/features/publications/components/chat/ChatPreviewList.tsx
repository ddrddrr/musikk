import { CenteredSpinner } from "@/features/common/CenteredSpinner.tsx";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { ChatNewGroupForm } from "@/features/publications/components/chat/ChatNewGroupForm.tsx";
import { ChatPreview } from "@/features/publications/components/chat/ChatPreview.tsx";
import { ChatStartDirectList } from "@/features/publications/components/chat/ChatStartDirectList.tsx";
import { useMyChats } from "@/features/publications/hooks/useMyChats.ts";
import { Button } from "@/features/ui/button.tsx";
import { Plus } from "lucide-react";
import { useState } from "react";

export function ChatPreviewList() {
    const { chats, isPending, error, refetch } = useMyChats();
    const [showNewGroupForm, setShowNewGroupForm] = useState(false);

    if (isPending) {
        return <CenteredSpinner className="min-h-[400px]" />;
    }

    if (showNewGroupForm) {
        return (
            <ChatNewGroupForm
                onSuccess={() => setShowNewGroupForm(false)}
                onCancel={() => setShowNewGroupForm(false)}
            />
        );
    }

    if (error) {
        return <QueryErrorBox message="Failed to load chats" onRetry={() => void refetch()} />;
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Chats</h2>
                <Button variant="brand" size="sm" onClick={() => setShowNewGroupForm(true)}>
                    <Plus className="mr-2 size-4" />
                    New Group
                </Button>
            </div>

            <div className="flex flex-col gap-1">
                {chats.length === 0 && <EmptyState message="No chats yet" />}
                {chats.map((chat) => (
                    <ChatPreview key={chat.uuid} chat={chat} />
                ))}
            </div>

            <div className="mt-2 border-t-2 border-foreground pt-4">
                <ChatStartDirectList />
            </div>
        </div>
    );
}
