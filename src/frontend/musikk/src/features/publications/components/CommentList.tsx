import { Comment } from "@/features/publications/components/Comment.tsx";
import { IPublication } from "@/features/publications/types.ts";

interface CommentListProps {
    comments: IPublication[];
    replyTo?: IPublication;
    setReplyTo: (comment: IPublication) => void;
}

export function CommentList({ comments, replyTo, setReplyTo }: CommentListProps) {
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
                        repliedTo={replyTo?.uuid === comment.uuid}
                    />
                );
            })}
        </div>
    );
}
