import { CommentForm } from "@/components/comments/CommentForm";
import { CommentList } from "@/components/comments/CommentList";
import { fetchCommentList } from "@/components/comments/queries.ts";
import { CommentObjectType } from "@/components/comments/types";
import { UUID } from "@/config/types.ts";
import { useQuery } from "@tanstack/react-query";

interface CommentBoxProps {
    objType: CommentObjectType;
    objUUID: UUID;
}

export function CommentBox({ objType, objUUID }: CommentBoxProps) {
    const { isPending, error, data } = useQuery({
        queryKey: ["comments", objUUID],
        queryFn: () => fetchCommentList(objType, objUUID),
    });

    if (isPending)
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );

    if (error)
        return (
            <div className="text-white text-center p-6 bg-red-500 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                An error has occurred: {error.message}
            </div>
        );

    return (
        <div className="flex flex-col border border-black rounded-lg bg-white h-full max-h-[600px] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <CommentList comments={data} />
            </div>
            <div className="border-t border-black p-4 bg-gray-100">
                <CommentForm objType={objType} objUUID={objUUID} />
            </div>
        </div>
    );
}
