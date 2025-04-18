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
        <div className="space-y-6">
            <SongDisplay song={queue?.head ? queue.nodes[0].song : null} />

            <div className="space-y-4">
                {nodes.length > 0 ? (
                    <>
                        <ul className="space-y-3 pr-2 custom-scrollbar" role="list">
                            {nodes.map((node) => (
                                <li key={node.uuid} className="bg-white p-4 rounded-md border border-black/20 w-full">
                                    <SongCard
                                        song={node.song}
                                        showImage={false}
                                        showAddToQueueButton={false}
                                        playButtonSize={14}
                                        playButtonClass="p-1 w-8 h-8"
                                        addButtonClass="p-1 w-8 h-8"
                                    />
                                </li>
                            ))}
                        </ul>

                        <Button
                            onClick={() => clearQueueMutation.mutate({ action: "clear" })}
                            variant="destructive"
                            className="w-full bg-red-500 hover:bg-red-600 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-[2px]"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear Queue
                        </Button>
                    </>
                ) : (
                    <div className="text-center py-6 bg-white rounded-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <p className="text-gray-600">Queue is empty</p>
                    </div>
                )}
            </div>
        </div>
    );
}
