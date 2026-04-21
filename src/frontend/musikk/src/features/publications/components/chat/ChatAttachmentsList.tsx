import { useInfiniteFlat } from "@/api/hooks.ts";
import { UUID } from "@/api/types.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { useChatAttachments } from "@/features/publications/api/queries.ts";
import { CollectionAttachmentRow } from "@/features/publications/components/chat/CollectionAttachmentRow.tsx";
import { SongAttachmentRow } from "@/features/publications/components/chat/SongAttachmentRow.tsx";
import { UserAttachmentRow } from "@/features/publications/components/chat/UserAttachmentRow.tsx";
import { Attachment } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { ScrollArea } from "@/features/ui/scroll-area.tsx";
import { Spinner } from "@/features/ui/spinner";
import { BaseUser } from "@/features/user/types.ts";

type ChatAttachmentsListProps = {
    chatUUID: UUID;
};

export function ChatAttachmentsList({ chatUUID }: ChatAttachmentsListProps) {
    const userUUID = useUserUUID();
    const query = useChatAttachments(userUUID, chatUUID);
    const {
        itemsFlat: attachments,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteFlat(query, false);

    if (query.isPending) {
        return (
            <div className="flex justify-center py-4">
                <Spinner className="size-6" />
            </div>
        );
    }

    if (query.error) {
        return (
            <QueryErrorBox
                message="Failed to load attachments"
                onRetry={() => void query.refetch()}
            />
        );
    }

    if (attachments.length === 0) {
        return <p className="py-4 text-center text-sm text-muted-foreground">No attachments yet</p>;
    }

    return (
        <div className="rounded-sm border border-foreground">
            <ScrollArea className="max-h-48">
                <div className="flex flex-col gap-1 px-2 py-2">
                    {attachments.map((attachment, i) => (
                        <ChatAttachmentItem key={i} attachment={attachment} />
                    ))}
                    {hasNextPage && (
                        <div className="flex justify-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void fetchNextPage()}
                                disabled={isFetchingNextPage}
                            >
                                {isFetchingNextPage && <Spinner className="size-4" />}
                                {!isFetchingNextPage && "Load more"}
                            </Button>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function ChatAttachmentItem({ attachment }: { attachment: Attachment }) {
    switch (attachment.type) {
        case "song":
            return <SongAttachmentRow song={attachment.obj as CollectionSong} />;
        case "collection":
            return <CollectionAttachmentRow collection={attachment.obj as Collection} />;
        case "user":
            return <UserAttachmentRow user={attachment.obj as BaseUser} />;
    }
}
