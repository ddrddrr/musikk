import { IComment } from "./types";

interface CommentProps {
    comment: IComment;
}

export function Comment({ comment }: CommentProps) {
    return (
        <div className="border border-black rounded-lg bg-gray-50 p-3">
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
        </div>
    );
}
