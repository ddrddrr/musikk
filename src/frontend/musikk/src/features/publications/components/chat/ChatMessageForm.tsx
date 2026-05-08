import { setFormServerErrors } from "@/api/errorUtils.ts";
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
import { z } from "zod";

type ChatMessageFormData = z.infer<typeof chatMessageSchema>;

interface ChatMessageFormProps {
    chat: Chat;
    onTyping?: () => void;
}

export function ChatMessageForm({ chat, onTyping }: ChatMessageFormProps) {
    const userUUID = useUserUUID();
    const form = useForm<ChatMessageFormData>({
        resolver: zodResolver(chatMessageSchema),
    });
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = form;
    const contentField = register("content");
    const serverErrorMessage = errors.root?.serverError?.message;

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
                    setFormServerErrors(form, error);
                },
            },
        );
    };

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="flex flex-col gap-2">
            <Textarea
                {...contentField}
                onChange={(e) => {
                    void contentField.onChange(e);
                    if (onTyping && e.target.value.length > 0) onTyping();
                }}
                placeholder="Type a message..."
                rows={2}
                className={"border border-foreground bg-card"}
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            {serverErrorMessage && <p className="text-xs text-destructive">{serverErrorMessage}</p>}

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
