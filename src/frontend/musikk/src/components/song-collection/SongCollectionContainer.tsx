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

    if (isPending) return <div></div>;
    if (error)
        return (
            <div className="text-white text-center p-4 bg-red-500 rounded-md border-2 border-black">
                An error has occurred: {error.message}
            </div>
        );

    const songs = data.songs;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="ghost"
                    onClick={onBackClick}
                    className="flex items-center text-black hover:text-gray-700 hover:bg-gray-200"
                >
                    <ChevronLeft className="mr-1" /> Back
                </Button>
                <h2 className="text-xl font-bold text-black">{collection.title}</h2>
                <div className="w-6"></div>
            </div>

            <div className="flex items-center bg-white p-4 rounded-md border-2 border-black">
                <img
                    src={collection.image || "/placeholder.svg?height=100&width=100"}
                    alt={collection.title}
                    className="w-24 h-24 object-cover border-2 border-black"
                />
                <div className="ml-4 flex-1">
                    <p className="text-lg font-bold">{collection.title}</p>
                    {data.description && <p className="text-sm text-gray-600 mt-1">{data.description}</p>}
                </div>
                <div className="flex gap-1">
                    <div className="bg-red-500 hover:bg-red-600 text-white border-2 border-black rounded-full h-10 w-10 p-0 flex items-center justify-center">
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
                        className="bg-gray-200 hover:bg-gray-300 text-black border-2 border-black rounded-full h-10 w-10 p-0 flex items-center justify-center"
                    >
                        <BetweenHorizonalStart size={18} />
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between mb-2">
                <h3 className="text-black font-bold">Songs • {songs.length}</h3>
            </div>

            {songs.length > 0 ? (
                <ul className="space-y-4" role="list">
                    {songs.map((song, index) => (
                        <li key={`${song.uuid}-${index}`} className="bg-gray-200 p-4 rounded-md border-2 border-black">
                            <SongCard song={song} />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8 text-gray-700 bg-white rounded-md border-2 border-black">
                    <p>No songs in this collection</p>
                </div>
            )}
        </div>
    );
}
