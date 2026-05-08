import { PostAttachment } from "@/features/publications/components/posts/PostAttachment.tsx";
import { PostHeader } from "@/features/publications/components/posts/PostHeader.tsx";
import { Publication } from "@/features/publications/types.ts";

interface CommentProps {
    comment: Publication;
    setReplyTo: (comment: Publication) => void;
}

export function Comment({ comment, setReplyTo }: CommentProps) {
    return (
        <div className="rounded-sm border border-foreground bg-muted p-3">
            {comment.parent_uuid && comment.parent_author && comment.parent_repr && (
                <div className="mb-2 min-w-0 border-l-2 border-foreground pl-2 text-xs text-muted-foreground">
                    <div className="truncate font-medium">
                        {comment.parent_author.display_name || "Anonymous"}
                    </div>
                    <div className="truncate italic">{comment.parent_repr}</div>
                </div>
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
                    <PostAttachment attachment={comment.attachment} size="compact" />
                </div>
            )}
            <button
                onClick={() => setReplyTo(comment)}
                className="mt-1 text-xs text-info hover:underline"
            >
                Reply
            </button>
        </div>
    );
}
