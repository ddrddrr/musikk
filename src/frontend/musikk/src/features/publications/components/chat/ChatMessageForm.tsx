import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useCreateChatMessage } from "@/features/publications/api/mutations.ts";
import { AttachmentPicker } from "@/features/publications/components/AttachmentPicker.tsx";
import { useAttachment } from "@/features/publications/hooks/useAttachment.ts";
import { chatMessageSchema } from "@/features/publications/schemas.ts";
import { Chat, Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { Textarea } from "@/features/ui/textarea.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

type ChatMessageFormData = z.infer<typeof chatMessageSchema>;

interface ChatMessageFormProps {
    chat: Chat;
    replyTo?: Publication;
    setReplyTo?: (message?: Publication) => void;
    onMessagePosted?: () => void;
}
// TODO: message style as in comments + attachment picker + avatar for the user who sent
// move chats to header as button instead of a context menu for profile
// same for connections
export function ChatMessageForm({ chat, onMessagePosted }: ChatMessageFormProps) {
    const userUUID = useUserUUID();
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ChatMessageFormData>({
        resolver: zodResolver(chatMessageSchema),
    });

    const createChatMessageMutation = useCreateChatMessage();

    const submitHandler = (data: ChatMessageFormData) => {
        if (!userUUID) return;

        createChatMessageMutation.mutate(
            {
                userUUID,
                chatUUID: chat.uuid,
                content: data.content,
            },
            {
                onSuccess: () => {
                    reset();
                    onMessagePosted?.();
                },
                onError: (error) => {
                    console.error("Failed to send message:", error);
                },
            },
        );
    };

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-2">
            <Textarea
                {...register("content")}
                placeholder="Type a message..."
                rows={2}
                className={"border border-black bg-white"}
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}

            <Button
                type="submit"
                variant="brand"
                size="lg"
                disabled={createChatMessageMutation.isPending}
                className={"w-1/3"}
            >
                {createChatMessageMutation.isPending ? "Sending..." : "Send"}
            </Button>
        </form>
    );
}
