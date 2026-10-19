import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { PublicationDraft, useCreateChatMessage } from "@/features/publications/api/mutations.ts";
import { PublicationForm } from "@/features/publications/components/PublicationForm.tsx";
import { chatMessageSchema } from "@/features/publications/schemas.ts";
import { Chat } from "@/features/publications/types.ts";

interface ChatMessageFormProps {
    chat: Chat;
    onTyping?: () => void;
}

export function ChatMessageForm({ chat, onTyping }: ChatMessageFormProps) {
    const userUUID = useUserUUID();
    const createChatMessageMutation = useCreateChatMessage();

    const submit = (draft: PublicationDraft) =>
        createChatMessageMutation.mutateAsync({ ...draft, userUUID, chatUUID: chat.uuid });

    return (
        <PublicationForm
            schema={chatMessageSchema}
            submitLabel="Send"
            pendingLabel="Sending..."
            placeholder="Type a message..."
            onTyping={onTyping}
            submit={submit}
        />
    );
}
