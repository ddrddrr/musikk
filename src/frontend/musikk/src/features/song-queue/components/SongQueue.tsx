import { SongQueueContainer } from "@/features/song-queue/components/SongQueueContainer.tsx";
import { useQueue, useQueueChangeAPI } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { SongDisplay } from "@/features/songs/components/SongDisplay.tsx";
import { Button } from "@/features/ui/button.tsx";
import { Trash2 } from "lucide-react";

export function SongQueue() {
    const clearQueueMutation = useQueueChangeAPI();
    const { data: queue } = useQueue();
    const nodes = queue?.nodes ?? [];
    const currentSong = queue?.nodes[0]?.collection_song?.song;

    return (
        <div className="flex h-full w-full">
            <div className="flex w-1/2 flex-col items-start justify-start border-r border-black p-8">
                <SongDisplay song={currentSong} />
            </div>

            <div className="relative flex w-1/2 flex-col">
                <div className="flex-1 overflow-y-auto p-8">
                    <h2 className="mb-4 text-2xl font-bold">Queue</h2>
                    <ul className="space-y-3">
                        {nodes.map((node) => (
                            <li key={node.uuid}>
                                <SongQueueContainer node={node} />
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-t border-black bg-white p-4">
                    <Button
                        onClick={() => clearQueueMutation.mutate({ action: "clear" })}
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
