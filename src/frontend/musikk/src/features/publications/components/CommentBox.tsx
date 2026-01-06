import { UUID } from "@/api/types.ts";
import { usePublicationListQuery } from "@/features/publications/api/queries.ts";
import { CommentForm } from "@/features/publications/components/CommentForm.tsx";
import { CommentList } from "@/features/publications/components/CommentList.tsx";
import { Publication, PublicationForType } from "@/features/publications/types.ts";
import { memo, useEffect, useRef, useState } from "react";

interface CommentBoxProps {
    objType: PublicationForType;
    objUUID: UUID;
}

export const CommentBox = memo(function CommentBox({ objType, objUUID }: CommentBoxProps) {
    const [replyTo, setReplyTo] = useState<Publication | undefined>(undefined);
    const { isPending, error, data } = usePublicationListQuery(objType, objUUID);
    const commentsContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }
        // TODO: probably shouldnt depend on data, just scroll once?
    }, [data]);

    // todo use new shadcn spinner
    if (isPending) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent"></div>
            </div>
        );
    }

    // todo create a centralized err message?
    if (error) {
        return (
            <div className="rounded-lg border-2 border-black bg-red-600 p-6 text-center text-white">
                An error has occurred: {error.message}
            </div>
        );
    }

    return (
        <div className="flex h-full max-h-[600px] flex-col overflow-hidden rounded-lg border-2 border-black bg-white">
            <div className="flex-1 space-y-4 overflow-y-auto p-4" ref={commentsContainerRef}>
                <CommentList comments={data} setReplyTo={setReplyTo} />
            </div>
            <div className="border-t-2 border-black bg-gray-100 p-4">
                <CommentForm
                    objType={objType}
                    objUUID={objUUID}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                />
            </div>
        </div>
    );
});
