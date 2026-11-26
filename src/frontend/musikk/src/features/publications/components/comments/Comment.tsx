import { PostAttachment } from "@/features/publications/components/posts/PostAttachment.tsx";
import { PostHeader } from "@/features/publications/components/posts/PostHeader.tsx";
import { ReplyButton } from "@/features/publications/components/ReplyButton.tsx";
import { ReplyQuote } from "@/features/publications/components/ReplyQuote.tsx";
import { Publication } from "@/features/publications/types.ts";

interface CommentProps {
    comment: Publication;
    setReplyTo: (comment: Publication) => void;
}

export function Comment({ comment, setReplyTo }: CommentProps) {
    return (
        <div className="rounded-sm border border-foreground bg-muted p-3">
            {comment.parent_uuid && comment.parent_author && comment.parent_repr && (
                <ReplyQuote
                    author={comment.parent_author}
                    text={comment.parent_repr}
                    className="mb-2"
                />
            )}
            <div className="mb-1">
                <PostHeader author={comment.author} dateAdded={comment.date_added} />
            </div>
            <p className="text-sm break-words text-foreground">
                {comment.is_deleted ? (
                    <span className="text-muted-foreground italic">Deleted</span>
                ) : (
                    comment.content
                )}
            </p>
            {!comment.is_deleted && comment.attachment && (
                <div className="mt-2">
                    <PostAttachment attachment={comment.attachment} size="sm" />
                </div>
            )}
            <ReplyButton onClick={() => setReplyTo(comment)} className="mt-1" />
        </div>
    );
}
