import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { BetweenHorizonalStart, ChevronLeft } from "lucide-react";

import { fetchCollectionDetailed } from "@/components/song-collection/queries";
import { SongCollectionPlayButton } from "@/components/song-collection/SongCollectionPlayButton.tsx";
import type { ISongCollection } from "@/components/song-collection/types";
import { SongCard } from "@/components/song/SongCard";
import { useQueueAddAPI } from "@/hooks/useQueueAPI.ts";

interface SongCollectionContainerProps {
    collection: ISongCollection;
    onBackClick: () => void;
}

export function SongCollectionContainer({ collection, onBackClick }: SongCollectionContainerProps) {
    const addToQueueMutation = useQueueAddAPI();

    const { isPending, error, data } = useQuery({
        queryKey: [collection.uuid],
        queryFn: () => fetchCollectionDetailed(collection.uuid),
    });

    if (isPending)
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );

    if (error)
        return (
            <div className="text-white text-center p-6 bg-red-500 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                An error has occurred: {error.message}
            </div>
        );

    const songs = data.songs;

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4">
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={onBackClick}
                    className="flex items-center text-black hover:text-gray-700 hover:bg-gray-200 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                    <ChevronLeft className="mr-1" /> Back
                </Button>
                <h2 className="text-2xl font-bold text-black">{collection.title}</h2>
                <div className="w-24"></div>
            </div>

            <div className="flex items-center bg-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <img
                    src={collection.image || "/placeholder.svg?height=100&width=100"}
                    alt={collection.title}
                    className="w-32 h-32 object-cover border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
                <div className="ml-6 flex-1">
                    <p className="text-xl font-bold">{collection.title}</p>
                    {data.description && <p className="text-gray-600 mt-2 line-clamp-2">{data.description}</p>}
                </div>
                <div className="flex gap-3">
                    <div className="bg-red-500 hover:bg-red-600 text-white border-2 border-black rounded-lg h-12 w-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-0 flex items-center justify-center">
                        <SongCollectionPlayButton collection={data} />
                    </div>
                    <Button
                        onClick={() =>
                            addToQueueMutation.mutate({
                                type: "collection",
                                item: collection,
                                action: "add",
                            })
                        }
                        disabled={addToQueueMutation.isPending}
                        className="bg-gray-200 hover:bg-gray-300 text-black border-2 border-black rounded-lg h-12 w-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-0 flex items-center justify-center"
                    >
                        <BetweenHorizonalStart size={20} />
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between px-2">
                <h3 className="text-black text-lg font-bold">Songs • {songs.length}</h3>
            </div>

            {songs.length > 0 ? (
                <ul className="space-y-4" role="list">
                    {songs.map((song, index) => (
                        <li
                            key={`${song.uuid}-${index}`}
                            className="bg-white p-4 rounded-md border border-gray-200 transition-colors hover:bg-gray-50"
                        >
                            <SongCard song={song} />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-12 text-gray-700 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="font-medium">No songs in this collection</p>
                </div>
            )}
        </div>
    );
}
