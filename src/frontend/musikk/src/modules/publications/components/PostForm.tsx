import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { UUID } from "@/api/types.ts";
import { usePublicationCreateMutation } from "@/modules/publications/api/mutations.ts";
import { postSchema } from "@/modules/publications/schemas.ts";
import { Attachment, IPublication } from "@/modules/publications/types.ts";
import { Collection } from "@/modules/song-collections/types.ts";

import { SearchBar } from "@/modules/search/SearchBar.tsx";
import { Button } from "@/modules/ui/button.tsx";
import { Textarea } from "@/modules/ui/textarea.tsx";

type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
    replyTo?: IPublication;
    setReplyTo?: (reply?: IPublication) => void;
    onSuccess?: () => void;
    feedUserUuid?: UUID;
}

export function PostForm({ replyTo, setReplyTo, onSuccess, feedUserUuid }: PostFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
    });

    const [attachedObj, setAttachedObj] = useState<Attachment | undefined>(undefined);

    const postMutation = usePublicationCreateMutation();

    const isCollection = (obj: Attachment): obj is Collection => {
        return "title" in obj && "authors" in obj;
    };

    const submitHandler = async (formData: PostFormData) => {
        const payload: {
            content: string;
            obj_type: "feed";
            obj_uuid: UUID;
            parent_uuid?: UUID;
            attachment_type?: "song" | "collection";
            attachment_uuid?: UUID;
        } = {
            content: formData.content,
            obj_type: "feed",
            obj_uuid: feedUserUuid!,
        };

        if (replyTo?.uuid) {
            payload.parent_uuid = replyTo.uuid;
        }

        if (attachedObj) {
            if (isCollection(attachedObj)) {
                payload.attachment_type = "collection";
                payload.attachment_uuid = attachedObj.uuid;
            } else {
                payload.attachment_type = "song";
                payload.attachment_uuid = attachedObj.uuid;
            }
        }

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

            <SearchBar
                onItemSelect={(obj) => setAttachedObj(obj)}
                placeholder={"Attach"}
                songMode={"card"}
            />

            {attachedObj && (
                <div className="text-xs text-muted-foreground italic">
                    Attached:{" "}
                    {isCollection(attachedObj) ? attachedObj.title : attachedObj.song.title}
                </div>
            )}

            <Button type="submit" variant="brand" className="px-4 py-2 rounded-sm">
                Submit
            </Button>
        </form>
    );
}
