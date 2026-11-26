import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { PublicationDraft, useCreateChatMessage } from "@/features/publications/api/mutations.ts";
import { PublicationForm } from "@/features/publications/components/PublicationForm.tsx";
import { ReplyPreview } from "@/features/publications/components/ReplyPreview.tsx";
import { chatMessageSchema } from "@/features/publications/schemas.ts";
import { Chat, Publication } from "@/features/publications/types.ts";

interface ChatMessageFormProps {
    chat: Chat;
    replyTo: Publication | undefined;
    setReplyTo: (message: Publication | undefined) => void;
    onTyping?: () => void;
}

export function ChatMessageForm({ chat, replyTo, setReplyTo, onTyping }: ChatMessageFormProps) {
    const userUUID = useUserUUID();
    const createChatMessageMutation = useCreateChatMessage();

    const submit = (draft: PublicationDraft) =>
        createChatMessageMutation.mutateAsync({
            ...draft,
            userUUID,
            chatUUID: chat.uuid,
            parentUUID: replyTo?.uuid,
        });

    const cancelReply = () => setReplyTo(undefined);

    return (
        <PublicationForm
            schema={chatMessageSchema}
            submitLabel="Send"
            pendingLabel="Sending..."
            placeholder="Type a message..."
            replyPreview={replyTo && <ReplyPreview replyTo={replyTo} onCancel={cancelReply} />}
            onTyping={onTyping}
            submit={submit}
            onSuccess={cancelReply}
        />
    );
}
