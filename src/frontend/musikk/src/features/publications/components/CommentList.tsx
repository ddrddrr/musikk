import { Comment } from "@/features/publications/components/Comment.tsx";
import { Publication } from "@/features/publications/types.ts";

interface CommentListProps {
    comments: Publication[];
    setReplyTo: (comment: Publication) => void;
}

export function CommentList({ comments, setReplyTo }: CommentListProps) {
    return (
        <div className="space-y-4">
            {comments.map((comment) => {
                const parent = comment.parent_uuid
                    ? comments.find((c) => c.uuid === comment.parent_uuid)
                    : undefined;

                return (
                    <Comment
                        key={comment.uuid}
                        comment={comment}
                        parent={parent}
                        setReplyTo={setReplyTo}
                    />
                );
            })}
        </div>
    );
}
