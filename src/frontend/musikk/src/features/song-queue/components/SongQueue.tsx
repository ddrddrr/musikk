import { CenteredSpinner } from "@/features/common/CenteredSpinner.tsx";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { usePlayback } from "@/features/playback/hooks/usePlayback.ts";
import { useQueueClear, useQueueRemoveItem } from "@/features/song-queue/api/mutations.ts";
import { useQueue } from "@/features/song-queue/api/queries.ts";
import { SongQueuePlayButton } from "@/features/song-queue/components/SongQueueContainerPlayButton.tsx";
import { DefaultSongActions } from "@/features/songs/components/DefaultSongActions.tsx";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { SongContextMenu } from "@/features/songs/components/SongContextMenu.tsx";
import { SongDisplay } from "@/features/songs/components/SongDisplay.tsx";
import { Button } from "@/features/ui/button.tsx";
import { ScrollArea } from "@/features/ui/scroll-area.tsx";
import { Trash2 } from "lucide-react";

export function SongQueue() {
    const clearMutation = useQueueClear();
    const removeItemMutation = useQueueRemoveItem();
    const { data: queue, error, isPending, refetch } = useQueue();
    const { playbackState } = usePlayback();

    if (error) {
        return <QueryErrorBox message="Failed to load queue" onRetry={() => void refetch()} />;
    }

    if (isPending) {
        return <CenteredSpinner className="h-full" />;
    }

    const items = queue?.items ?? [];
    const contextItems = queue?.context_items ?? [];
    const currentSong = playbackState?.collectionSong.song;

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
                                                <DefaultSongActions
                                                    collectionSong={item.collection_song}
                                                    playButton={<SongQueuePlayButton item={item} />}
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
                                                actions={<DefaultSongActions collectionSong={cs} />}
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
