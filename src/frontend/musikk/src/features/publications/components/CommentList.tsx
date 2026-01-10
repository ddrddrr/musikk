import { Comment } from "@/features/publications/components/Comment.tsx";
import { Publication } from "@/features/publications/types.ts";

interface CommentListProps {
    comments: Publication[];
    setReplyTo: (comment: Publication) => void;
}

export function CommentList({ comments, setReplyTo }: CommentListProps) {
    return (
        <div className="space-y-4">
            {comments.map((comment) => (
                <Comment key={comment.uuid} comment={comment} setReplyTo={setReplyTo} />
            ))}
        </div>
    );
}
