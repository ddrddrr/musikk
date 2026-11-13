import { CenteredSpinner } from "@/features/common/CenteredSpinner.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { useComments } from "@/features/publications/api/queries.ts";
import { CommentForm } from "@/features/publications/components/comments/CommentForm.tsx";
import { CommentList } from "@/features/publications/components/comments/CommentList.tsx";
import { COMMENTS_BORDER_BY_TYPE } from "@/features/publications/components/comments/commentsBorder.ts";
import { LoadOlderButton } from "@/features/publications/components/LoadOlderButton.tsx";
import { NewMessagesIndicator } from "@/features/publications/components/NewMessagesIndicator.tsx";
import { TypingIndicator } from "@/features/publications/components/TypingIndicator.tsx";
import { useAutoScrollToBottom } from "@/features/publications/hooks/useAutoScrollToBottom.ts";
import { useCommentsWsEvents } from "@/features/publications/hooks/useCommentsWsEvents.ts";
import { useNewMessagesIndicator } from "@/features/publications/hooks/useNewMessagesIndicator.ts";
import { useScrollAnchor } from "@/features/publications/hooks/useScrollAnchor.ts";
import { useTypingIndicator } from "@/features/publications/hooks/useTypingIndicator.ts";
import { CommentableObjectRef, Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip.tsx";
import { cn } from "@/lib/utils.ts";
import { commentsTopic, commentsTypingEvent } from "@/ws/topics.ts";
import { X } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

const NO_COMMENTS: Publication[] = [];

interface CommentBoxProps {
    commentable: CommentableObjectRef;
    title: string;
    closeTo: string;
    className?: string;
}

export function CommentBox({ commentable, title, closeTo, className }: CommentBoxProps) {
    const borderColor = COMMENTS_BORDER_BY_TYPE[commentable.type];

    return (
        <div
            className={cn(
                "flex h-full max-h-[600px] flex-col overflow-hidden rounded-sm border-2 bg-card",
                borderColor,
                className,
            )}
        >
            <div
                className={cn(
                    "flex items-center justify-between gap-2 border-b-2 bg-muted px-4 py-2",
                    borderColor,
                )}
            >
                <p className="min-w-0 truncate text-sm">
                    <span className="text-muted-foreground">Comments on </span>
                    <span className="font-bold">{title}</span>
                </p>
                <IconTooltip label="Close">
                    <Button variant="ghost" size="icon-sm" aria-label="Close comments" asChild>
                        <Link to={closeTo}>
                            <X />
                        </Link>
                    </Button>
                </IconTooltip>
            </div>
            <CommentThread commentable={commentable} borderColor={borderColor} />
        </div>
    );
}

interface CommentThreadProps {
    commentable: CommentableObjectRef;
    borderColor: string;
}

// TODO: add proper infinite scroll, read about https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
function CommentThread({ commentable, borderColor }: CommentThreadProps) {
    useCommentsWsEvents(commentable);
    const { typers, notifyTyping } = useTypingIndicator(
        commentsTopic(commentable),
        commentsTypingEvent(commentable),
    );
    const [replyTo, setReplyTo] = useState<Publication | undefined>(undefined);
    const {
        error,
        isPending,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        refetch,
        data: comments = NO_COMMENTS,
    } = useComments(commentable);
    const commentsContainerRef = useRef<HTMLDivElement | null>(null);
    useAutoScrollToBottom(commentsContainerRef, isPending, comments);
    useScrollAnchor(commentsContainerRef, isFetchingNextPage);
    const { hasNewMessages, scrollToBottom } = useNewMessagesIndicator(
        commentsContainerRef,
        comments,
    );

    if (isPending) {
        return <CenteredSpinner className="min-h-[400px]" />;
    }

    if (error) {
        return (
            <div className="p-4">
                <QueryErrorBox message="Failed to load comments" onRetry={() => void refetch()} />
            </div>
        );
    }

    return (
        <>
            <div className="relative min-h-0 flex-1">
                <div className="h-full overflow-y-auto p-4" ref={commentsContainerRef}>
                    <div className="mb-4 flex justify-center">
                        <LoadOlderButton
                            hasNextPage={hasNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                            fetchNextPage={fetchNextPage}
                        />
                    </div>
                    <CommentList comments={comments} setReplyTo={setReplyTo} />
                </div>
                <NewMessagesIndicator visible={hasNewMessages} onClick={scrollToBottom} />
            </div>

            <TypingIndicator typers={typers} />

            <div className={cn("border-t-2 bg-muted p-4", borderColor)}>
                <CommentForm
                    commentable={commentable}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    onTyping={notifyTyping}
                />
            </div>
        </>
    );
}
