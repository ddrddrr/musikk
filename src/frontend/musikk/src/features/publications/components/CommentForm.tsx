import { UUID } from "@/api/types.ts";
import { usePublicationCreateMutation } from "@/features/publications/api/mutations.ts";
import { commentSchema } from "@/features/publications/schemas.ts";
import { Publication, PublicationForType } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormDataProps {
    objType: PublicationForType;
    objUUID: UUID;
    replyTo?: Publication;
    setReplyTo?: (comment?: Publication) => void;
}

export function CommentForm({ objType, objUUID, replyTo, setReplyTo }: CommentFormDataProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CommentFormData>({
        resolver: zodResolver(commentSchema),
    });

    const addCommentMutation = usePublicationCreateMutation();
    const submitHandler = (data: CommentFormData) => {
        addCommentMutation.mutate(
            {
                obj_type: objType,
                obj_uuid: objUUID,
                content: data.content,
                parent_uuid: replyTo?.uuid,
            },
            {
                onSuccess: () => {
                    reset();
                    setReplyTo?.(undefined);
                },
                onError: (error) => {
                    console.error("Failed to add comment:", error);
                },
            },
        );
    };

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-2">
            {replyTo && (
                <div className="mb-2 flex items-start justify-between rounded-sm border border-black bg-blue-500 p-2 text-xs text-white">
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
                        className="ml-4 shrink-0 text-white"
                    >
                        Cancel
                    </Button>
                </div>
            )}
            <textarea
                {...register("content")}
                className="w-full rounded-sm border-2 border-black bg-white p-2 text-sm"
                placeholder="Write a comment..."
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
            <Button type="submit" variant="brand" className="rounded-sm px-4 py-2">
                Post Comment
            </Button>
        </form>
    );
}
