import { SongCard } from "@/components/song/SongCard.tsx";
import { SongDisplay } from "@/components/song/SongDisplay.tsx";
import { Button } from "@/components/ui/button";
import { useQueue, useQueueChangeAPI } from "@/hooks/useQueueAPI.ts";
import { PlayingCollectionContext } from "@/providers/playingCollectionContext.ts";
import { PlayingSongContext } from "@/providers/playingSongContext.ts";
import { Trash2 } from "lucide-react";
import { useContext, useEffect } from "react";

// TODO: implement SSE for multi-device updates
export function SongQueue() {
    const clearQueueMutation = useQueueChangeAPI();
    const { queue } = useQueue();
    const { setPlayingSong } = useContext(PlayingSongContext);
    const { setPlayingCollection } = useContext(PlayingCollectionContext);

    const nodes = queue?.nodes ?? [];

    useEffect(() => {
        if (setPlayingSong && setPlayingCollection) {
            if (queue?.head) {
                setPlayingSong(queue.nodes[0].song);
            } else {
                setPlayingSong(null);
                setPlayingCollection(null);
            }
        }
    }, [queue?.head, setPlayingSong, setPlayingCollection]);

    return (
        <div className="space-y-4">
            <SongDisplay song={queue?.head ? queue.nodes[0].song : null} />

            <div className="space-y-4">
                {nodes.length > 0 ? (
                    <>
                        <ul className="space-y-4 pr-2" role="list">
                            {" "}
                            {nodes.map((node) => (
                                <li key={node.uuid} className="bg-gray-200 p-4 rounded-md border-2 border-black w-full">
                                    <SongCard song={node.song} />
                                </li>
                            ))}
                        </ul>

                        <Button
                            onClick={() => clearQueueMutation.mutate({ action: "clear" })}
                            variant="destructive"
                            className="w-full bg-red-600 hover:bg-red-700 text-white border-2 border-black"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear Queue
                        </Button>
                    </>
                ) : (
                    <div className="text-center py-6 bg-gray-100 rounded-md border-2 border-gray-300">
                        <p className="text-gray-500">Queue is empty</p>
                    </div>
                )}
            </div>
        </div>
    );
}
