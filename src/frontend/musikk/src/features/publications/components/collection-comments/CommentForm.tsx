import { UUID } from "@/api/types.ts";
import { useCreateCollectionComment } from "@/features/publications/api/mutations.ts";
import { commentSchema } from "@/features/publications/schemas.ts";
import { Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormDataProps {
    collectionUUID: UUID;
    replyTo?: Publication;
    setReplyTo?: (comment?: Publication) => void;
    onCommentPosted?: () => void;
}

export function CommentForm({
    collectionUUID,
    replyTo,
    setReplyTo,
    onCommentPosted,
}: CommentFormDataProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CommentFormData>({
        resolver: zodResolver(commentSchema),
    });

    const createCollectionCommentMutation = useCreateCollectionComment();
    const submitHandler = (data: CommentFormData) => {
        createCollectionCommentMutation.mutate(
            {
                collectionUUID,
                content: data.content,
                parentUUID: replyTo?.uuid,
            },
            {
                onSuccess: () => {
                    reset();
                    setReplyTo?.(undefined);
                    onCommentPosted?.();
                },
            },
        );
    };

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-2">
            {replyTo && (
                <div className="mb-2 flex justify-between rounded-sm border border-black bg-amber-100 p-2 text-xs text-gray-600">
                    <div className="max-w-xs truncate">
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
            <textarea
                {...register("content")}
                className="w-full rounded-sm border border-black bg-white p-2 text-sm"
                placeholder="Write a comment..."
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
            <Button type="submit" variant="brand" className="rounded-sm px-4 py-2">
                Post Comment
            </Button>
        </form>
    );
}
