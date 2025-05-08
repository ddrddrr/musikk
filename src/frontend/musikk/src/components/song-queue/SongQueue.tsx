import { SongContainer } from "@/components/songs/SongContainer.tsx";
import { SongDisplay } from "@/components/songs/SongDisplay.tsx";
import { Button } from "@/components/ui/button";
import { useQueue, useQueueChangeAPI } from "@/hooks/useQueueAPI.ts";
import { Trash2 } from "lucide-react";
import { memo } from "react";

export const SongQueue = memo(function SongQueue() {
    const clearQueueMutation = useQueueChangeAPI();
    const { data: queue } = useQueue();

    const nodes = queue?.nodes ?? [];
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {nodes.length > 0 ? (
                    <>
                        <SongDisplay song={queue?.nodes[0].collection_song.song} />

                        <ul className="space-y-3 pr-2 custom-scrollbar" role="list">
                            {nodes.map((node) => (
                                <li key={node.uuid} className="bg-white p-4 rounded-sm border border-black/20 w-full">
                                    <SongContainer
                                        collectionSong={node.collection_song}
                                        showImage={false}
                                        showAddToQueueButton={false}
                                        buttonSize={14}
                                        buttonClass="p-1 w-8 h-8"
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
                    <div className="text-center py-6 bg-white rounded-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <p className="text-gray-600">Queue is empty</p>
                    </div>
                )}
            </div>
        </div>
    );
});
