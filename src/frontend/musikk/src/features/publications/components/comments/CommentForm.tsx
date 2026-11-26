import { PublicationDraft, useCreateComment } from "@/features/publications/api/mutations.ts";
import { PublicationForm } from "@/features/publications/components/PublicationForm.tsx";
import { ReplyPreview } from "@/features/publications/components/ReplyPreview.tsx";
import { commentSchema } from "@/features/publications/schemas.ts";
import { CommentableObjectRef, Publication } from "@/features/publications/types.ts";

interface CommentFormProps {
    commentable: CommentableObjectRef;
    replyTo: Publication | undefined;
    setReplyTo: (comment: Publication | undefined) => void;
    onTyping?: () => void;
}

export function CommentForm({ commentable, replyTo, setReplyTo, onTyping }: CommentFormProps) {
    const createCommentMutation = useCreateComment();

    const submit = (draft: PublicationDraft) =>
        createCommentMutation.mutateAsync({
            ...draft,
            commentable,
            parentUUID: replyTo?.uuid,
        });

    const cancelReply = () => setReplyTo(undefined);

    return (
        <PublicationForm
            schema={commentSchema}
            submitLabel="Post Comment"
            pendingLabel="Posting..."
            placeholder="Write a comment..."
            replyPreview={replyTo && <ReplyPreview replyTo={replyTo} onCancel={cancelReply} />}
            onTyping={onTyping}
            submit={submit}
            onSuccess={cancelReply}
        />
    );
}
