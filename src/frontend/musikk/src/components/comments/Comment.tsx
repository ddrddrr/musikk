import { IComment } from "@/components/comments/types";

interface CommentProps {
    comment: IComment;
    setReplyTo: (comment: IComment) => void;
    repliedTo?: boolean;
    parent?: IComment;
}

export function Comment({ comment, setReplyTo, repliedTo, parent }: CommentProps) {
    return (
        <div className={`border border-black rounded-lg p-3 ${repliedTo ? "bg-yellow-100" : "bg-gray-50"}`}>
            {parent && (
                <div className="text-xs text-gray-600 border border-gray-300 bg-gray-100 p-2 mb-2 rounded">
                    <div className="font-medium truncate">{parent.username || "Anonymous"}</div>
                    <div className="italic truncate">{parent.content}</div>
                </div>
            )}
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-black truncate max-w-[50%]">
                    {comment.username || "Anonymous"}
                </span>
                <span className="text-[10px] text-gray-600 truncate text-right max-w-[50%]">
                    {new Date(comment.date_added).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })}
                </span>
            </div>
            <p className="text-sm text-gray-800">
                {comment.is_deleted ? <span className="italic text-gray-400">Deleted</span> : comment.content}
            </p>
            <button onClick={() => setReplyTo(comment)} className="text-xs text-blue-600 hover:underline mt-1">
                Reply
            </button>
        </div>
    );
}
