import { CommentForm } from "@/components/comments/CommentForm";
import { CommentList } from "@/components/comments/CommentList";
import { fetchCommentList } from "@/components/comments/queries";
import { CommentObjectType, IComment } from "@/components/comments/types";
import { UUID } from "@/config/types";
import { useQuery } from "@tanstack/react-query";
import { memo, useEffect, useRef, useState } from "react";

interface CommentBoxProps {
    objType: CommentObjectType;
    objUUID: UUID;
}

export const CommentBox = memo(function CommentBox({ objType, objUUID }: CommentBoxProps) {
    const [replyTo, setReplyTo] = useState<IComment | undefined>(undefined);
    const { isPending, error, data } = useQuery({
        queryKey: ["comments", objUUID],
        queryFn: () => fetchCommentList(objType, objUUID),
    });
    const commentsContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }
    }, [data]);

    if (isPending) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-white text-center p-6 bg-red-600 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                An error has occurred: {error.message}
            </div>
        );
    }

    return (
        <div className="flex flex-col border border-black rounded-lg bg-white h-full max-h-[600px] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={commentsContainerRef}>
                <CommentList comments={data} replyTo={replyTo} setReplyTo={setReplyTo} />
            </div>
            <div className="border-t border-black p-4 bg-gray-100">
                <CommentForm objType={objType} objUUID={objUUID} replyTo={replyTo} setReplyTo={setReplyTo} />
            </div>
        </div>
    );
});
