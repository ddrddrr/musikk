import { getErrorDetail } from "@/api/errorUtils.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { QueueItem } from "@/features/song-queue/api/types.ts";
import { SongQueuePlayButton } from "@/features/song-queue/components/SongQueueContainerPlayButton.tsx";
import { useQueue, useQueueClear } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { removeItem } from "@/features/song-queue/mutations.ts";
import { queueKeys } from "@/features/song-queue/queryKeys.ts";
import { songButtonProps } from "@/features/songs/components/DefaultSongActions.tsx";
import { SongAddToLikedButton } from "@/features/songs/components/SongAddToLikedButton.tsx";
import { SongAddToQueueButton } from "@/features/songs/components/SongAddToQueueButton.tsx";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { SongContextMenu } from "@/features/songs/components/SongContextMenu.tsx";
import { SongDisplay } from "@/features/songs/components/SongDisplay.tsx";
import { SongMenuButton } from "@/features/songs/components/SongMenuButton.tsx";
import { SongPlayButton } from "@/features/songs/components/SongPlayButton.tsx";
import { Button } from "@/features/ui/button.tsx";
import { ScrollArea } from "@/features/ui/scroll-area.tsx";
import { Spinner } from "@/features/ui/spinner";
import { cn } from "@/lib/utils.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useContext } from "react";
import { toast } from "sonner";

function SongQueueActions({
    collectionSong,
    item,
    onRemoveFromQueue,
}: {
    collectionSong: CollectionSong;
    item?: QueueItem;
    onRemoveFromQueue?: () => void;
}) {
    const btn = songButtonProps.normal;
    return (
        <div className={cn("flex items-center", btn.gap)}>
            {item ? (
                <SongQueuePlayButton item={item} size={btn.size} className={btn.padding} />
            ) : (
                <SongPlayButton
                    collectionSong={collectionSong}
                    size={btn.size}
                    className={btn.padding}
                />
            )}
            <SongAddToLikedButton
                collectionSong={collectionSong}
                size={btn.size}
                className={btn.padding}
            />
            <SongAddToQueueButton
                collectionSong={collectionSong}
                size={btn.size}
                className={btn.padding}
            />
            <SongMenuButton
                collectionSong={collectionSong}
                size={btn.size}
                className={btn.padding}
                iconSize={btn.iconSize}
                onRemoveFromQueue={onRemoveFromQueue}
            />
        </div>
    );
}

export function SongQueue() {
    const queryClient = useQueryClient();
    const clearMutation = useQueueClear();
    const removeItemMutation = useMutation({
        mutationFn: removeItem,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queueKeys.base });
        },
        onError: (error: Error) => {
            toast.error(getErrorDetail(error, "Failed to remove song from queue"));
        },
    });
    const { data: queue, error, isPending, refetch } = useQueue();
    const { playingCollectionSong } = useContext(PlaybackContext);

    if (error) {
        return <QueryErrorBox message="Failed to load queue" onRetry={() => void refetch()} />;
    }

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <Spinner className="size-8" />
            </div>
        );
    }

    const items = queue?.items ?? [];
    const contextItems = queue?.context_items ?? [];
    const currentSong = playingCollectionSong?.song;

    return (
        <div className="flex h-full w-full">
            <div className="flex w-1/2 flex-col items-start justify-start border-r border-foreground p-8">
                <SongDisplay song={currentSong} />
            </div>

            <div className="relative flex min-h-0 w-1/2 flex-col">
                <h2 className="p-8 pb-0 text-2xl font-bold">Queue</h2>
                <ScrollArea className="min-h-0 flex-1">
                    {items.length === 0 && (
                        <EmptyState variant="inline" message="Queue is empty" className="p-8" />
                    )}
                    {items.length > 0 && (
                        <ul className="flex flex-col gap-3 p-8">
                            {items.map((item) => (
                                <li key={item.uuid}>
                                    <SongContextMenu
                                        song={item.collection_song}
                                        onRemoveFromQueue={() =>
                                            removeItemMutation.mutate(item.uuid)
                                        }
                                    >
                                        <SongContainer
                                            collectionSong={item.collection_song}
                                            actions={
                                                <SongQueueActions
                                                    collectionSong={item.collection_song}
                                                    item={item}
                                                    onRemoveFromQueue={() =>
                                                        removeItemMutation.mutate(item.uuid)
                                                    }
                                                />
                                            }
                                        />
                                    </SongContextMenu>
                                </li>
                            ))}
                        </ul>
                    )}

                    {contextItems.length > 0 && (
                        <>
                            <h3 className="p-8 pb-0 text-2xl font-bold">Up Next</h3>
                            <ul className="flex flex-col gap-3 p-8">
                                {contextItems.map((cs) => (
                                    <li key={cs.uuid}>
                                        <SongContextMenu song={cs}>
                                            <SongContainer
                                                collectionSong={cs}
                                                actions={<SongQueueActions collectionSong={cs} />}
                                            />
                                        </SongContextMenu>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </ScrollArea>

                <div className="border-t border-foreground bg-muted p-4">
                    <Button
                        onClick={() => clearMutation.mutate()}
                        variant="destructive"
                        className="w-full"
                    >
                        <Trash2 className="mr-2 size-4" />
                        Clear Queue
                    </Button>
                </div>
            </div>
        </div>
    );
}
