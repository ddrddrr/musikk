import { getErrorDetail } from "@/api/errorUtils.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useCreateChatMessage } from "@/features/publications/api/mutations.ts";
import { AttachmentPicker } from "@/features/publications/components/AttachmentPicker.tsx";
import { useAttachment } from "@/features/publications/hooks/useAttachment.ts";
import { chatMessageSchema } from "@/features/publications/schemas.ts";
import { Chat } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { Textarea } from "@/features/ui/textarea.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type ChatMessageFormData = z.infer<typeof chatMessageSchema>;

interface ChatMessageFormProps {
    chat: Chat;
}
// TODO: message style as in comments + attachment picker + avatar for the user who sent
// move chats to header as button instead of a context menu for profile
// same for connections
export function ChatMessageForm({ chat }: ChatMessageFormProps) {
    const userUUID = useUserUUID();
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ChatMessageFormData>({
        resolver: zodResolver(chatMessageSchema),
    });

    const { attachedObj, setAttachedObj, getAttachmentData, clearAttachment } = useAttachment();
    const createChatMessageMutation = useCreateChatMessage();

    const submitHandler = (data: ChatMessageFormData) => {
        if (!userUUID) return;

        const { attachmentType, attachmentUUID } = getAttachmentData();

        createChatMessageMutation.mutate(
            {
                userUUID,
                chatUUID: chat.uuid,
                content: data.content,
                attachmentType,
                attachmentUUID,
            },
            {
                onSuccess: () => {
                    reset();
                    clearAttachment();
                },
                onError: (error) => {
                    toast.error(getErrorDetail(error, "Failed to send message"));
                },
            },
        );
    };

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="flex flex-col gap-2">
            <Textarea
                {...register("content")}
                placeholder="Type a message..."
                rows={2}
                className={"border border-foreground bg-card"}
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}

            <div className="flex items-start gap-2">
                <Button
                    type="submit"
                    variant="brand"
                    disabled={createChatMessageMutation.isPending}
                >
                    {createChatMessageMutation.isPending ? "Sending..." : "Send"}
                </Button>
                <AttachmentPicker attachedObj={attachedObj} onAttach={setAttachedObj} />
            </div>
        </form>
    );
}
