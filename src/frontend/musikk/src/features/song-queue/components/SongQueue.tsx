import { Spinner } from "@/components/ui/spinner";
import { CollectionSong } from "@/features/collections/types.ts";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { QueueItem } from "@/features/song-queue/api/types.ts";
import { SongQueuePlayButton } from "@/features/song-queue/components/SongQueueContainerPlayButton.tsx";
import { useQueue, useQueueClear } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { SongAddToLikedButton } from "@/features/songs/components/SongAddToLikedButton.tsx";
import { SongAddToQueueButton } from "@/features/songs/components/SongAddToQueueButton.tsx";
import { songButtonProps } from "@/features/songs/components/DefaultSongActions.tsx";
import { SongContextMenu } from "@/features/songs/components/SongContextMenu.tsx";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { SongDisplay } from "@/features/songs/components/SongDisplay.tsx";
import { Button } from "@/features/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { Trash2 } from "lucide-react";

function SongQueueActions({
    item,
    collectionSong,
}: {
    item: QueueItem;
    collectionSong: CollectionSong;
}) {
    const btn = songButtonProps.normal;
    return (
        <div className={cn("flex items-center", btn.gap)}>
            <SongQueuePlayButton item={item} size={btn.size} className={btn.padding} />
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
        </div>
    );
}

export function SongQueue() {
    const clearMutation = useQueueClear();
    const { data: queue, error, isPending, refetch } = useQueue();

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
    const currentSong = queue?.current_song?.song;

    return (
        <div className="flex h-full w-full">
            <div className="flex w-1/2 flex-col items-start justify-start border-r border-black p-8">
                <SongDisplay song={currentSong} />
            </div>

            <div className="relative flex w-1/2 flex-col">
                <div className="flex-1 overflow-y-auto p-8">
                    <h2 className="mb-4 text-2xl font-bold">Queue</h2>
                    <ul className="space-y-3">
                        {items.map((item) => (
                            <li key={item.uuid}>
                                <SongContextMenu song={item.collection_song}>
                                    <SongContainer
                                        collectionSong={item.collection_song}
                                        actions={
                                            <SongQueueActions
                                                item={item}
                                                collectionSong={item.collection_song}
                                            />
                                        }
                                    />
                                </SongContextMenu>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-t border-black bg-white p-4">
                    <Button
                        onClick={() => clearMutation.mutate()}
                        variant="destructive"
                        className="w-full"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Queue
                    </Button>
                </div>
            </div>
        </div>
    );
}
