import { UUID } from "@/api/types.ts";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { CommentForm } from "@/features/publications/components/collection-comments/CommentForm.tsx";
import { CommentList } from "@/features/publications/components/collection-comments/CommentList.tsx";
import { LoadOlderButton } from "@/features/publications/components/LoadOlderButton.tsx";
import { NewMessagesIndicator } from "@/features/publications/components/NewMessagesIndicator.tsx";
import { TypingIndicator } from "@/features/publications/components/TypingIndicator.tsx";
import { useAutoScrollToBottom } from "@/features/publications/hooks/useAutoScrollToBottom.ts";
import { useCollectionCommentsWsEvents } from "@/features/publications/hooks/useCollectionCommentsWsEvents.ts";
import { useNewMessagesIndicator } from "@/features/publications/hooks/useNewMessagesIndicator.ts";
import { useCollectionCommentsFlat } from "@/features/publications/hooks/usePublicationsInfiniteFlat.ts";
import { useScrollAnchor } from "@/features/publications/hooks/useScrollAnchor.ts";
import { useTypingIndicator } from "@/features/publications/hooks/useTypingIndicator.ts";
import { Publication } from "@/features/publications/types.ts";
import { Spinner } from "@/features/ui/spinner";
import { memo, useRef, useState } from "react";

interface CommentBoxProps {
    collectionUUID: UUID;
}
// TODO: add proper infinite scroll, read about https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API

export const CommentBox = memo(function CommentBox({ collectionUUID }: CommentBoxProps) {
    useCollectionCommentsWsEvents(collectionUUID);
    const { typers, notifyTyping } = useTypingIndicator(
        `collection_comments.${collectionUUID}`,
        "collection_comments.typing",
    );
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
    const commentsEndRef = useRef<HTMLDivElement | null>(null);
    useAutoScrollToBottom(commentsEndRef, isPending, publicationsFlat);
    useScrollAnchor(commentsContainerRef, isFetchingNextPage);
    const { hasNewMessages, scrollToBottom } = useNewMessagesIndicator(
        commentsContainerRef,
        commentsEndRef,
        publicationsFlat,
    );

    if (isPending) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (error) {
        return <QueryErrorBox message="Failed to load comments" onRetry={() => void refetch()} />;
    }

    return (
        <div className="flex h-full max-h-[600px] flex-col overflow-hidden rounded-sm border-2 border-foreground bg-card">
            <div className="relative min-h-0 flex-1">
                <div className="h-full overflow-y-auto p-4" ref={commentsContainerRef}>
                    <div className="mb-4 flex justify-center">
                        <LoadOlderButton
                            hasNextPage={hasNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                            fetchNextPage={fetchNextPage}
                        />
                    </div>
                    <CommentList comments={publicationsFlat} setReplyTo={setReplyTo} />
                    <div ref={commentsEndRef} />
                </div>
                <NewMessagesIndicator visible={hasNewMessages} onClick={scrollToBottom} />
            </div>

            <TypingIndicator typers={typers} />

            <div className="border-t-2 border-foreground bg-muted p-4">
                <CommentForm
                    collectionUUID={collectionUUID}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    onTyping={notifyTyping}
                />
            </div>
        </div>
    );
});
