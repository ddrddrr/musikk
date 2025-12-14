import { UUID } from "@/api/types.ts";
import { usePublicationListQuery } from "@/modules/publications/api/queries.ts";
import { CommentForm } from "@/modules/publications/components/CommentForm.tsx";
import { CommentList } from "@/modules/publications/components/CommentList.tsx";
import { IPublication, PublicationForType } from "@/modules/publications/types.ts";
import { memo, useEffect, useRef, useState } from "react";

interface CommentBoxProps {
    objType: PublicationForType;
    objUUID: UUID;
}

export const CommentBox = memo(function CommentBox({ objType, objUUID }: CommentBoxProps) {
    const [replyTo, setReplyTo] = useState<IPublication | undefined>(undefined);
    const { isPending, error, data } = usePublicationListQuery(objType, objUUID);
    const commentsContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }
    }, [data]);

    // todo use new shadcn spinner
    if (isPending) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // todo create a centralized err message?
    if (error) {
        return (
            <div className="text-white text-center p-6 bg-red-600 rounded-lg border-2 border-black">
                An error has occurred: {error.message}
            </div>
        );
    }

    // todo some shadcn component?
    return (
        <div className="flex flex-col border border-black rounded-lg bg-white h-full max-h-[600px] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={commentsContainerRef}>
                <CommentList comments={data} replyTo={replyTo} setReplyTo={setReplyTo} />
            </div>
            <div className="border-t border-black p-4 bg-gray-100">
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
