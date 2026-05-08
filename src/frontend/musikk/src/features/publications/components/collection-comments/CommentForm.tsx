import { setFormServerErrors } from "@/api/errorUtils.ts";
import { UUID } from "@/api/types.ts";
import { useCreateCollectionComment } from "@/features/publications/api/mutations.ts";
import { AttachmentPicker } from "@/features/publications/components/AttachmentPicker.tsx";
import { useAttachment } from "@/features/publications/hooks/useAttachment.ts";
import { commentSchema } from "@/features/publications/schemas.ts";
import { Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { Textarea } from "@/features/ui/textarea.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormDataProps {
    collectionUUID: UUID;
    replyTo?: Publication;
    setReplyTo?: (comment?: Publication) => void;
    onTyping?: () => void;
}

export function CommentForm({
    collectionUUID,
    replyTo,
    setReplyTo,
    onTyping,
}: CommentFormDataProps) {
    const form = useForm<CommentFormData>({
        resolver: zodResolver(commentSchema),
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
    const createCollectionCommentMutation = useCreateCollectionComment();
    const submitHandler = (data: CommentFormData) => {
        const { attachmentType, attachmentUUID } = getAttachmentData();
        createCollectionCommentMutation.mutate(
            {
                collectionUUID,
                content: data.content,
                parentUUID: replyTo?.uuid,
                attachmentType,
                attachmentUUID,
            },
            {
                onSuccess: () => {
                    reset();
                    setReplyTo?.(undefined);
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
            {replyTo && (
                <div className="mb-2 flex items-start justify-between border-l-2 border-foreground pl-2 text-xs text-muted-foreground">
                    <div className="max-w-xs min-w-0 truncate">
                        <div className="truncate font-medium">
                            {replyTo.author.display_name || "Anonymous"}
                        </div>
                        <div className="truncate italic">{replyTo.content}</div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyTo?.(undefined)}
                        className="shrink-0"
                    >
                        Cancel
                    </Button>
                </div>
            )}
            <Textarea
                {...contentField}
                onChange={(e) => {
                    void contentField.onChange(e);
                    if (onTyping && e.target.value.length > 0) onTyping();
                }}
                className="border border-foreground bg-card"
                placeholder="Write a comment..."
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            <AttachmentPicker attachedObj={attachedObj} onAttach={setAttachedObj} />
            {serverErrorMessage && <p className="text-xs text-destructive">{serverErrorMessage}</p>}
            <Button
                type="submit"
                variant="brand"
                className="rounded-sm px-4 py-2"
                disabled={createCollectionCommentMutation.isPending}
            >
                {createCollectionCommentMutation.isPending ? "Posting..." : "Post Comment"}
            </Button>
        </form>
    );
}
