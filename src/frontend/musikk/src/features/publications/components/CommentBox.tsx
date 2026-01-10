import { UUID } from "@/api/types.ts";
import { usePublicationListInfiniteQuery } from "@/features/publications/api/queries.ts";
import { CommentForm } from "@/features/publications/components/CommentForm.tsx";
import { CommentList } from "@/features/publications/components/CommentList.tsx";
import { Publication, PublicationForType } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { memo, useEffect, useMemo, useRef, useState } from "react";

interface CommentBoxProps {
    objType: PublicationForType;
    objUUID: UUID;
}
// TODO: add proper infinite scroll, read about https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API

export const CommentBox = memo(function CommentBox({ objType, objUUID }: CommentBoxProps) {
    const [replyTo, setReplyTo] = useState<Publication | undefined>(undefined);
    const { data, error, isPending, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
        usePublicationListInfiniteQuery(objType, objUUID);
    const commentsContainerRef = useRef<HTMLDivElement | null>(null);
    const didInitialScrollRef = useRef(false);

    // reverse since BE returns newest first
    const comments = useMemo(() => {
        const flat = data?.pages.flatMap((p) => p.results) ?? [];
        return flat.slice().reverse();
    }, [data]);

    useEffect(() => {
        if (isPending || didInitialScrollRef.current || !data || !commentsContainerRef.current)
            return;

        commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        didInitialScrollRef.current = true;
    }, [isPending, data]);

    // todo use new shadcn spinner
    if (isPending) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-sm border-2 border-black border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-sm border-2 border-black bg-red-600 p-4 text-white">
                <div className="text-sm font-medium">Failed to load comments</div>
                <Button variant="brand" size="lg" onClick={refetch}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="flex h-full max-h-[600px] flex-col overflow-hidden rounded-sm border-2 border-black bg-white">
            <div className="min-h-0 flex-1 overflow-y-auto p-4" ref={commentsContainerRef}>
                {hasNextPage && (
                    <div className="mb-4 flex justify-center">
                        <Button
                            variant="brand"
                            onClick={fetchNextPage}
                            disabled={isFetchingNextPage}
                        >
                            {isFetchingNextPage ? "Loading..." : "Load older"}
                        </Button>
                    </div>
                )}
                <CommentList comments={comments} setReplyTo={setReplyTo} />
            </div>

            <div className="border-t-2 border-black bg-gray-100 p-4">
                <CommentForm
                    objType={objType}
                    objUUID={objUUID}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    onCommentPosted={() => {
                        if (commentsContainerRef.current) {
                            commentsContainerRef.current.scrollTop =
                                commentsContainerRef.current.scrollHeight;
                        }
                    }}
                />
            </div>
        </div>
    );
});
