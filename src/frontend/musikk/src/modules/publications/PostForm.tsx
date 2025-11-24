import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUserPostCreateMutation } from "@/modules/publications/mutations";
import { postSchema } from "@/modules/publications/schemas";
import { IAttachment, IPublication } from "@/modules/publications/types";

import { SearchBar } from "@/modules/search/SearchBar.tsx";
import { Button } from "@/modules/ui/button";
import { Textarea } from "@/modules/ui/textarea";

type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
    replyTo?: IPublication;
    setReplyTo?: (reply?: IPublication) => void;
    onSuccess?: () => void;
}

export function PostForm({ replyTo, setReplyTo, onSuccess }: PostFormProps) {
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
        };

        await postMutation.mutateAsync(payload);

        reset();
        setReplyTo?.(undefined);
        setAttachedObj(undefined);
        onSuccess?.();
    };

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-3">
            <Textarea {...register("content")} />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}

            <SearchBar onItemSelect={(obj) => setAttachedObj(obj)} placeholder={"Attach"} songMode={"card"} />

            {attachedObj && <div className="text-xs text-muted-foreground italic">Attached: {attachedObj.repr}</div>}

            <Button
                type="submit"
                variant="brand"
                className="px-4 py-2 rounded-sm"
            >
                Submit
            </Button>
        </form>
    );
}
