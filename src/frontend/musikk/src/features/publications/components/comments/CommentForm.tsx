import { PublicationDraft, useCreateComment } from "@/features/publications/api/mutations.ts";
import { PublicationForm } from "@/features/publications/components/PublicationForm.tsx";
import { commentSchema } from "@/features/publications/schemas.ts";
import { CommentableObjectRef, Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { OverflowTooltip } from "@/features/ui/tooltip.tsx";

interface CommentFormProps {
    commentable: CommentableObjectRef;
    replyTo?: Publication;
    setReplyTo?: (comment?: Publication) => void;
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

    const cancelReply = () => setReplyTo?.(undefined);

    return (
        <PublicationForm
            schema={commentSchema}
            submitLabel="Post Comment"
            pendingLabel="Posting..."
            placeholder="Write a comment..."
            replyPreview={replyTo && <ReplyPreview reply={replyTo} onCancel={cancelReply} />}
            onTyping={onTyping}
            submit={submit}
            onSuccess={cancelReply}
        />
    );
}

function ReplyPreview({ reply, onCancel }: { reply: Publication; onCancel: () => void }) {
    return (
        <div className="mb-2 flex items-start justify-between border-l-2 border-foreground pl-2 text-xs text-muted-foreground">
            <div className="max-w-xs min-w-0 truncate">
                <OverflowTooltip label={reply.author.display_name || "Anonymous"}>
                    <div className="truncate font-medium">
                        {reply.author.display_name || "Anonymous"}
                    </div>
                </OverflowTooltip>
                <OverflowTooltip label={reply.content}>
                    <div className="truncate italic">{reply.content}</div>
                </OverflowTooltip>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="shrink-0">
                Cancel
            </Button>
        </div>
    );
}
