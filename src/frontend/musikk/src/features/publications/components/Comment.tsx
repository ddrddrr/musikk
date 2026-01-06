import { Publication } from "@/features/publications/types.ts";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";

interface CommentProps {
    comment: Publication;
    setReplyTo: (comment: Publication) => void;
    parent?: Publication;
}

export function Comment({ comment, setReplyTo, parent }: CommentProps) {
    return (
        <div className={`"bg-gray-50" : "bg-gray-50" rounded-lg border border-black p-3`}>
            {parent && (
                <div className="mb-2 rounded border border-gray-300 bg-gray-100 p-2 text-xs text-gray-600">
                    <div className="truncate font-medium">
                        {parent.author.display_name || "Anonymous"}
                    </div>
                    <div className="truncate italic">{parent.content}</div>
                </div>
            )}
            <div className="mb-1 flex items-center justify-between">
                <UserIdentifier user={comment.author} />
                <span className="max-w-[50%] truncate text-right text-[10px] text-gray-600">
                    {new Date(comment.date_added).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })}
                </span>
            </div>
            <p className="text-sm text-gray-800">
                {comment.is_deleted ? (
                    <span className="text-gray-400 italic">Deleted</span>
                ) : (
                    comment.content
                )}
            </p>
            <button
                onClick={() => setReplyTo(comment)}
                className="mt-1 text-xs text-blue-600 hover:underline"
            >
                Reply
            </button>
        </div>
    );
}
