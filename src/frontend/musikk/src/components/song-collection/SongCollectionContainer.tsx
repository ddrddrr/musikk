

import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { fetchCollectionDetailed } from "@/components/song-collection/queries";
import type { ISongCollection } from "@/components/song-collection/types";
import { SongCard } from "@/components/song/SongCard";
import type { ISong } from "@/components/song/types";

interface SongCollectionContainerProps {
    collection: ISongCollection;
    selectedSong: ISong | null;
    handleSongClick: (song: ISong) => void;
    onBackClick: () => void;
}

export function SongCollectionContainer({
    collection,
    selectedSong,
    handleSongClick,
    onBackClick,
}: SongCollectionContainerProps) {
    const { isPending, error, data, isFetching } = useQuery({
        queryKey: [collection.uuid],
        queryFn: () => fetchCollectionDetailed(collection.uuid),
    });

    if (isPending) return <div className="text-white text-center">Loading...</div>;
    if (error) return <div className="text-white text-center">An error has occurred: {error.message}</div>;

    const songs = data.songs;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="ghost"
                    onClick={onBackClick}
                    className="flex items-center text-white hover:underline p-0"
                >
                    <ChevronLeft className="mr-1" /> Back
                </Button>
                <h2 className="text-xl font-bold text-white">{collection.title}</h2>
                <div className="w-6"></div>
                {/* Empty div for flex spacing */}
            </div>

            {/* Collection Header */}
            <div className="flex items-center bg-white p-4 rounded-md border-2 border-black mb-4">
                <img
                    src={collection.image || "/placeholder.svg?height=100&width=100"}
                    alt={collection.title}
                    className="w-24 h-24 object-cover border-2 border-black"
                />
                <div className="ml-4">
                    <p className="text-lg ml-4">
                        {"{"}"{collection.title}"{"}"}:
                    </p>
                </div>
            </div>

            {songs.length > 0 ? (
                <ul className="space-y-4" role="list">
                    {songs.map((song) => (
                        <li key={song.uuid} className="bg-gray-200 p-4 rounded-md border-2 border-black">
                            <SongCard
                                title={song.title}
                                artist={song.artist}
                                isPlaying={selectedSong?.uuid === song.uuid}
                                onClick={() => handleSongClick(song)}
                            />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8 text-white bg-red-500 rounded-md">
                    <p>No songs in this collection</p>
                </div>
            )}
        </div>
    );
}
