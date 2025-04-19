import { Comment } from "@/components/comments/Comment";
import { IComment } from "@/components/comments/types";

interface CommentListProps {
    comments: IComment[];
}

export function CommentList({ comments }: CommentListProps) {
    return (
        <div className="space-y-4">
            {comments.map((comment) => (
                <Comment key={comment.uuid} comment={comment} />
            ))}
        </div>
    );
}
