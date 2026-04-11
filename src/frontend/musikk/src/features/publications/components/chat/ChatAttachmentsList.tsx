import { UUID } from "@/api/types.ts";
import { useInfiniteFlat } from "@/api/hooks.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { CollectionCard } from "@/features/collections/components/CollectionCard.tsx";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { useChatAttachments } from "@/features/publications/api/queries.ts";
import { Attachment } from "@/features/publications/types.ts";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { Button } from "@/features/ui/button.tsx";
import { ScrollArea } from "@/features/ui/scroll-area.tsx";
import { Spinner } from "@/features/ui/spinner";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";
import { BaseUser } from "@/features/user/types.ts";

type ChatAttachmentsListProps = {
    chatUUID: UUID;
};

export function ChatAttachmentsList({ chatUUID }: ChatAttachmentsListProps) {
    const userUUID = useUserUUID();
    const query = useChatAttachments(userUUID, chatUUID);
    const { itemsFlat: attachments, hasNextPage, isFetchingNextPage, fetchNextPage } =
        useInfiniteFlat(query, false);

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
        return (
            <p className="py-4 text-center text-sm text-muted-foreground">
                No attachments yet
            </p>
        );
    }

    return (
        <div className="rounded-sm border border-black">
            <ScrollArea className="max-h-48">
                <div className="flex flex-col gap-2 py-2">
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
            return <SongContainer collectionSong={attachment.obj as CollectionSong} size="compact" />;
        case "collection":
            return <CollectionCard collection={attachment.obj as Collection} size="small" />;
        case "user":
            return <UserIdentifier user={attachment.obj as BaseUser} />;
    }
}
