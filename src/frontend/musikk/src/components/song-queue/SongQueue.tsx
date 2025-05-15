import { SongContainer } from "@/components/songs/SongContainer";
import { SongDisplay } from "@/components/songs/SongDisplay";
import { Button } from "@/components/ui/button";
import { useQueue, useQueueChangeAPI } from "@/hooks/useQueueAPI";
import { Trash2 } from "lucide-react";

export function SongQueue() {
    const clearQueueMutation = useQueueChangeAPI();
    const { data: queue } = useQueue();
    const nodes = queue?.nodes ?? [];
    const currentSong = queue?.nodes[0]?.collection_song?.song;

    return (
        <div className="flex w-full h-full">
            <div className="w-1/2 flex flex-col items-start justify-start p-8 border-r border-black">
                <SongDisplay song={currentSong} />
            </div>

            <div className="w-1/2 flex flex-col relative">
                <div className="p-8 overflow-y-auto flex-1">
                    <h2 className="text-2xl font-bold mb-4">Queue</h2>
                    <ul className="space-y-3">
                        {nodes.map((node) => (
                            <li key={node.uuid}>
                                <SongContainer
                                    collectionSong={node.collection_song}
                                />
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-4 border-t border-black bg-white">
                    <Button
                        onClick={() => clearQueueMutation.mutate({ action: "clear" })}
                        variant="destructive"
                        className="w-full"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Queue
                    </Button>
                </div>
            </div>
        </div>
    );
}
