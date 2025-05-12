import { commentSchema } from "@/components/publications/schemas.ts";
import { commentCreate } from "@/components/publications/mutations";
import { PublicationObjectType, IPublication } from "@/components/publications/types";
import { UUID } from "@/config/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormDataProps {
    objType: PublicationObjectType;
    objUUID: UUID;
    replyTo?: IPublication;
    setReplyTo?: (comment?: IPublication) => void;
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

    const addCommentMutation = useMutation({
        mutationFn: commentCreate,
        onSuccess: () => {
            reset();
            setReplyTo?.(undefined);
        },
        onError: (error) => {
            console.error("Failed to add comment:", error);
        },
    });

    const submitHandler = (data: CommentFormData) => {
        addCommentMutation.mutate({
            objType,
            objUUID,
            content: data.content,
            replyToUUID: replyTo?.uuid,
        });
    };

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-2">
            {replyTo && (
                <div className="text-xs text-gray-600 border border-blue-300 bg-blue-100 p-2 mb-2 rounded flex justify-between items-start">
                    <div className="truncate max-w-xs">
                        <div className="font-medium truncate">{replyTo.display_name || "Anonymous"}</div>
                        <div className="italic truncate">{replyTo.content}</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setReplyTo?.(undefined)}
                        className="text-blue-600 hover:underline ml-4 shrink-0"
                    >
                        Cancel
                    </button>
                </div>
            )}
            <textarea
                {...register("content")}
                className="w-full p-2 text-sm bg-white border-2 border-black rounded shadow"
                placeholder="Write a comment..."
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
            <button
                type="submit"
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white border-2 border-black rounded-lg shadow"
            >
                Post Comment
            </button>
        </form>
    );
}
