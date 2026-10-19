import { UUID } from "@/api/types.ts";
import {
    PublicationDraft,
    useCreateCollectionComment,
} from "@/features/publications/api/mutations.ts";
import { PublicationForm } from "@/features/publications/components/PublicationForm.tsx";
import { commentSchema } from "@/features/publications/schemas.ts";
import { Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";

interface CommentFormProps {
    collectionUUID: UUID;
    replyTo?: Publication;
    setReplyTo?: (comment?: Publication) => void;
    onTyping?: () => void;
}

export function CommentForm({ collectionUUID, replyTo, setReplyTo, onTyping }: CommentFormProps) {
    const createCollectionCommentMutation = useCreateCollectionComment();

    const submit = (draft: PublicationDraft) =>
        createCollectionCommentMutation.mutateAsync({
            ...draft,
            collectionUUID,
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
                <div className="truncate font-medium">
                    {reply.author.display_name || "Anonymous"}
                </div>
                <div className="truncate italic">{reply.content}</div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="shrink-0">
                Cancel
            </Button>
        </div>
    );
}
