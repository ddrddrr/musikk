import { Publication } from "@/features/publications/types.ts";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";

interface CommentProps {
    comment: Publication;
    setReplyTo: (comment: Publication) => void;
}

export function Comment({ comment, setReplyTo }: CommentProps) {
    return (
        <div className="rounded-sm border border-black bg-gray-50 p-3">
            {comment.parent_uuid && comment.parent_author && comment.parent_repr && (
                <div className="mb-2 rounded border border-gray-300 bg-amber-100 p-2 text-xs text-gray-600">
                    <div className="truncate font-medium">
                        {comment.parent_author.display_name || "Anonymous"}
                    </div>
                    <div className="truncate italic">{comment.parent_repr}</div>
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
