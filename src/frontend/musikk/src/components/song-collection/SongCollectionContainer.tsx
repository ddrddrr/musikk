import { CommentBox } from "@/components/comments/CommentBox";
import { fetchCollectionDetailed } from "@/components/song-collection/queries";
import { SongCollectionHeader } from "@/components/song-collection/SongCollectionHeader";
import type { ISongCollection } from "@/components/song-collection/types";
import { SongCard } from "@/components/song/SongCard";
import { useQuery } from "@tanstack/react-query";

interface SongCollectionContainerProps {
    collection: ISongCollection;
    onBackClick: () => void;
    showComments: boolean;
    toggleComments: () => void;
}

export function SongCollectionContainer({
    collection,
    onBackClick,
    showComments,
    toggleComments,
}: SongCollectionContainerProps) {
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
        <div className={`flex gap-4 ${showComments ? "flex-row" : "flex-col"} max-w-4xl mx-auto p-4`}>
            <div className={showComments ? "w-1/2 pr-2" : "space-y-4"}>
                <SongCollectionHeader
                    collection={data}
                    onBackClick={onBackClick}
                    showComments={showComments}
                    toggleComments={toggleComments}
                    songsCount={songs.length}
                />

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

            {/* Animated Comment Section */}
            <div
                className={`w-1/2 pl-2 transition-all duration-500 ease-in-out transform ${
                    showComments ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                }`}
            >
                {showComments && <CommentBox objType="collection" objUUID={collection.uuid} />}
            </div>
        </div>
    );
}
