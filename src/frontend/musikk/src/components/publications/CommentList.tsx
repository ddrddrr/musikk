import { Comment } from "@/components/publications/Comment";
import { IPublication } from "@/components/publications/types";

interface CommentListProps {
    comments: IPublication[];
    replyTo?: IPublication;
    setReplyTo: (comment: IPublication) => void;
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
