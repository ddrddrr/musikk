import { commentSchema } from "@/components/comments/commentFormSchema.ts";
import { addComment } from "@/components/comments/mutations.ts";
import { CommentObjectType } from "@/components/comments/types.ts";
import { UUID } from "@/config/types.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormDataProps {
    objType: CommentObjectType;
    objUUID: UUID;
}

export function CommentForm({ objType, objUUID }: CommentFormDataProps) {
    const addCommentMutation = useMutation({
        mutationFn: addComment,
        onSuccess: () => {
            reset();
        },
        onError: (error) => {
            console.error("Failed to add comment:", error);
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CommentFormData>({
        resolver: zodResolver(commentSchema),
    });

    const submitHandler = (data: CommentFormData) => {
        addCommentMutation.mutate({ objType, objUUID, content: data.content });
    };

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-2">
            <textarea
                {...register("content")}
                className="w-full p-2 text-sm bg-white border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                placeholder="Write a comment..."
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
            <button
                type="submit"
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
                Post Comment
            </button>
        </form>
    );
}
