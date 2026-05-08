import { setFormServerErrors } from "@/api/errorUtils.ts";
import { UUID } from "@/api/types.ts";
import { useCreatePost } from "@/features/publications/api/mutations.ts";
import { AttachmentPicker } from "@/features/publications/components/AttachmentPicker.tsx";
import { useAttachment } from "@/features/publications/hooks/useAttachment.ts";
import { postSchema } from "@/features/publications/schemas.ts";
import { Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { Textarea } from "@/features/ui/textarea.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
    feedUserUUID: UUID;
    replyTo?: Publication;
    setReplyTo?: (reply?: Publication) => void;
    onSuccess?: () => void;
}

export function PostForm({ feedUserUUID, replyTo, setReplyTo, onSuccess }: PostFormProps) {
    const form = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
    });
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = form;
    const serverErrorMessage = errors.root?.serverError?.message;

    const { attachedObj, setAttachedObj, getAttachmentData, clearAttachment } = useAttachment();
    const createPostMutation = useCreatePost();

    const submitHandler = (formData: PostFormData) => {
        const { attachmentType, attachmentUUID } = getAttachmentData();

        createPostMutation.mutate(
            {
                userUUID: replyTo ? replyTo.created_for.uuid : feedUserUUID,
                content: formData.content,
                parentUUID: replyTo?.uuid,
                attachmentType,
                attachmentUUID,
            },
            {
                onSuccess: () => {
                    reset();
                    setReplyTo?.(undefined);
                    clearAttachment();
                    onSuccess?.();
                },
                onError: (error) => {
                    setFormServerErrors(form, error);
                },
            },
        );
    };

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="flex flex-col gap-3">
            <Textarea {...register("content")} />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}

            <AttachmentPicker attachedObj={attachedObj} onAttach={setAttachedObj} />

            {serverErrorMessage && <p className="text-xs text-destructive">{serverErrorMessage}</p>}

            <Button
                type="submit"
                variant="brand"
                className="rounded-sm px-4 py-2"
                disabled={createPostMutation.isPending}
            >
                {createPostMutation.isPending ? "Posting..." : "Submit"}
            </Button>
        </form>
    );
}
