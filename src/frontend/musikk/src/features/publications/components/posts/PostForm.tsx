import { UUID } from "@/api/types.ts";
import { PublicationDraft, useCreatePost } from "@/features/publications/api/mutations.ts";
import { PublicationForm } from "@/features/publications/components/PublicationForm.tsx";
import { postSchema } from "@/features/publications/schemas.ts";
import { Publication } from "@/features/publications/types.ts";

interface PostFormProps {
    feedUserUUID: UUID;
    replyTo?: Publication;
    setReplyTo?: (reply?: Publication) => void;
    onSuccess?: () => void;
}

export function PostForm({ feedUserUUID, replyTo, setReplyTo, onSuccess }: PostFormProps) {
    const createPostMutation = useCreatePost();

    const submit = (draft: PublicationDraft) =>
        createPostMutation.mutateAsync({
            ...draft,
            userUUID: replyTo ? replyTo.created_for.uuid : feedUserUUID,
            parentUUID: replyTo?.uuid,
        });

    const handleSuccess = () => {
        setReplyTo?.(undefined);
        onSuccess?.();
    };

    return (
        <PublicationForm
            schema={postSchema}
            submitLabel="Submit"
            pendingLabel="Posting..."
            submit={submit}
            onSuccess={handleSuccess}
        />
    );
}
