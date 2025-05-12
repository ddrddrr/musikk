import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUserPostCreateMutation } from "@/components/publications/mutations";
import { postSchema } from "@/components/publications/schemas";
import { IAttachment, IPublication } from "@/components/publications/types";
import { UUID } from "@/config/types";

import { SearchBar } from "@/components/search/SearchBar.tsx";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
    userUUID: UUID;
    replyTo?: IPublication;
    setReplyTo?: (reply?: IPublication) => void;
    onSuccess?: () => void;
}

export function PostForm({ userUUID, replyTo, setReplyTo, onSuccess }: PostFormProps) {
    const queryClient = useQueryClient();
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
    });

    const [attachedObj, setAttachedObj] = useState<IAttachment | undefined>(undefined);
    const postMutation = useUserPostCreateMutation();

    const submitHandler = async (data: PostFormData) => {
        const payload = {
            content: data.content,
            objType: attachedObj?.objType,
            objUUID: attachedObj?.objUUID,
            replyToUUID: replyTo?.uuid,
            userUUID: userUUID,
        };

        await postMutation.mutateAsync(payload);
        queryClient.invalidateQueries({ queryKey: ["posts", userUUID] });

        reset();
        setReplyTo?.(undefined);
        setAttachedObj(undefined);
        onSuccess?.();
    };

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-3">
            <Textarea {...register("content")} />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}

            <SearchBar onItemSelect={(obj) => setAttachedObj(obj)} placeholder={"Attach"} />

            {attachedObj && <div className="text-xs text-muted-foreground italic">Attached: {attachedObj.repr}</div>}

            <Button
                type="submit"
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white border-2 border-black rounded-lg shadow"
            >
                Submit
            </Button>
        </form>
    );
}
