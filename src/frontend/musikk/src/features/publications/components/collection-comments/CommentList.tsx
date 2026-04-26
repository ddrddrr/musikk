import { EmptyState } from "@/features/common/EmptyState.tsx";
import { Comment } from "@/features/publications/components/collection-comments/Comment.tsx";
import { Publication } from "@/features/publications/types.ts";

interface CommentListProps {
    comments: Publication[];
    setReplyTo: (comment: Publication) => void;
}

export function CommentList({ comments, setReplyTo }: CommentListProps) {
    if (comments.length === 0) {
        return <EmptyState message="No comments yet" />;
    }

    return (
        <div className="flex flex-col gap-4">
            {comments.map((comment) => (
                <Comment key={comment.uuid} comment={comment} setReplyTo={setReplyTo} />
            ))}
        </div>
    );
}
