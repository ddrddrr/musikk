import { UUID } from "@/api/types.ts";
import { CommentForm } from "@/features/publications/components/collection-comments/CommentForm.tsx";
import { CommentList } from "@/features/publications/components/collection-comments/CommentList.tsx";
import { LoadOlderButton } from "@/features/publications/components/LoadOlderButton.tsx";
import { useCollectionCommentsFlat } from "@/features/publications/hooks/usePublicationsInfiniteFlat.ts";
import { Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { memo, useEffect, useRef, useState } from "react";

interface CommentBoxProps {
    collectionUUID: UUID;
}
// TODO: add proper infinite scroll, read about https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API

export const CommentBox = memo(function CommentBox({ collectionUUID }: CommentBoxProps) {
    const [replyTo, setReplyTo] = useState<Publication | undefined>(undefined);
    const {
        error,
        isPending,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        refetch,
        publicationsFlat,
    } = useCollectionCommentsFlat(collectionUUID);
    const commentsContainerRef = useRef<HTMLDivElement | null>(null);
    const didInitialScrollRef = useRef(false);

    useEffect(() => {
        if (didInitialScrollRef.current || !commentsContainerRef.current) return;

        commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        didInitialScrollRef.current = true;
    }, []);

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
                <Button variant="brand" size="lg" onClick={void refetch}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="flex h-full max-h-[600px] flex-col overflow-hidden rounded-sm border-2 border-black bg-white">
            <div className="min-h-0 flex-1 overflow-y-auto p-4" ref={commentsContainerRef}>
                <div className="mb-4 flex justify-center">
                    <LoadOlderButton
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        fetchNextPage={fetchNextPage}
                    />
                </div>
                <CommentList comments={publicationsFlat} setReplyTo={setReplyTo} />
            </div>

            <div className="border-t-2 border-black bg-gray-100 p-4">
                <CommentForm
                    collectionUUID={collectionUUID}
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
