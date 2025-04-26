import { fetchCollectionDetailed } from "@/components/song-collection/queries.ts";
import { SongCollectionPlayButton } from "@/components/song-collection/SongCollectionPlayButton.tsx";
import { SongCard } from "@/components/song/SongCard.tsx";
import { UUID } from "@/config/types.ts";
import { useQuery } from "@tanstack/react-query";

interface LikedSongsContainerProps {
    collectionUUID: UUID;
}

export function LikedSongsContainer({ collectionUUID }: LikedSongsContainerProps) {
    const { isPending, error, data } = useQuery({
        queryKey: [collectionUUID],
        queryFn: () => fetchCollectionDetailed(collectionUUID),
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
        <div className="flex flex-col max-w-4xl mx-auto p-4 space-y-4">
            <div className="flex items-center bg-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <img
                    src={data.image || "/placeholder.svg?height=100&width=100"}
                    alt={data.title}
                    className="object-cover border-2 border-black rounded-lg w-32 h-32"
                />
                <div className="ml-6 flex-1">
                    <p className="text-xl font-bold">{data.title}</p>
                    {data.description && (
                        <p className="text-gray-600 mt-2 line-clamp-2 text-base">{data.description}</p>
                    )}
                </div>
                <div className="flex items-center">
                    <div className="bg-red-500 hover:bg-red-600 text-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-12 w-12 flex items-center justify-center">
                        <SongCollectionPlayButton collection={data} />
                    </div>
                </div>
            </div>

            <h3 className="text-black text-lg font-bold">Songs • {songs.length}</h3>

            {songs.length > 0 ? (
                <ul className="space-y-4" role="list">
                    {songs.map((song, index) => (
                        <li
                            key={`${song.uuid}-${index}`}
                            className="bg-white p-4 rounded-sm border border-gray-200 transition-colors hover:bg-gray-50"
                        >
                            <SongCard song={song} />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-12 text-gray-700 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="font-medium">Nothing to show... Add something! :)</p>
                </div>
            )}
        </div>
    );
}
