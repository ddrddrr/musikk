import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { UUID } from "@/api/types.ts";
import { usePublicationCreateMutation } from "@/features/publications/api/mutations.ts";
import { postSchema } from "@/features/publications/schemas.ts";
import { Attachment, Publication } from "@/features/publications/types.ts";
import { Collection } from "@/features/song-collections/types.ts";

import { SearchBar } from "@/features/search/SearchBar.tsx";
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
            obj_uuid: feedUserUUID!,
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
                    Attached: {/*TODO: DOESNT WORK, add reprs for all objects?*/}
                    {attachedObj.title}
                </div>
            )}

            <Button type="submit" variant="brand" className="rounded-sm px-4 py-2">
                Submit
            </Button>
        </form>
    );
}
