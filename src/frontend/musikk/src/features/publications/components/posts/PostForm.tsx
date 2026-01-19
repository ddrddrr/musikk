import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

import { UUID } from "@/api/types.ts";
import { useCreatePost } from "@/features/publications/api/mutations.ts";
import { AttachmentPicker } from "@/features/publications/components/AttachmentPicker.tsx";
import { useAttachment } from "@/features/publications/hooks/useAttachment.ts";
import { postSchema } from "@/features/publications/schemas.ts";
import { Publication } from "@/features/publications/types.ts";

import { Button } from "@/features/ui/button.tsx";
import { Textarea } from "@/features/ui/textarea.tsx";

type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
    replyTo?: Publication;
    setReplyTo?: (reply?: Publication) => void;
    onSuccess?: () => void;
    feedUserUUID?: UUID;
}

export function PostForm({ replyTo, setReplyTo, onSuccess, feedUserUUID }: PostFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
    });

    const { attachedObj, setAttachedObj, getAttachmentData, clearAttachment } = useAttachment();
    const createPostMutation = useCreatePost();

    const submitHandler = async (formData: PostFormData) => {
        const { attachmentType, attachmentUUID } = getAttachmentData();

        await createPostMutation.mutateAsync({
            userUUID: feedUserUUID!,
            content: formData.content,
            parentUUID: replyTo?.uuid,
            attachmentType,
            attachmentUUID,
        });

        reset();
        setReplyTo?.(undefined);
        clearAttachment();
        onSuccess?.();
    };

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-3">
            <Textarea {...register("content")} />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}

            <AttachmentPicker attachedObj={attachedObj} onAttach={setAttachedObj} />

            <Button type="submit" variant="brand" className="rounded-sm px-4 py-2">
                Submit
            </Button>
        </form>
    );
}
