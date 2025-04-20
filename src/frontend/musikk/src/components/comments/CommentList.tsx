import { Comment } from "@/components/comments/Comment";
import { IComment } from "@/components/comments/types";

interface CommentListProps {
    comments: IComment[];
    replyTo?: IComment;
    setReplyTo: (comment: IComment) => void;
}

export function CommentList({ comments, replyTo, setReplyTo }: CommentListProps) {
    return (
        <div className="space-y-4">
            {comments.map((comment) => {
                const parent = comment.parent ? comments.find((c) => c.uuid === comment.parent) : undefined;

                return (
                    <Comment
                        key={comment.uuid}
                        comment={comment}
                        parent={parent}
                        setReplyTo={setReplyTo}
                        repliedTo={replyTo?.uuid === comment.uuid}
                    />
                );
            })}
        </div>
    );
}
