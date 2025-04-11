import {useQuery} from "@tanstack/react-query";


import {SongCard} from "@/components/song/SongCard.tsx"
import type {ISong} from "@/components/song/types"
import type {ISongCollection} from "@/components/song-collection/types"
import {fetchCollectionDetailed} from "@/components/song-collection/queries.ts";

interface SongCollectionContainerProps {
    collection: ISongCollection
    selectedSong: ISong | null
    handleSongClick: (song: ISong) => void
}

export function SongCollectionContainer({collection, selectedSong, handleSongClick}: SongCollectionContainerProps) {
    const {isPending, error, data, isFetching} = useQuery({
        queryKey: [collection.uuid],
        queryFn: () => fetchCollectionDetailed(collection.uuid)
    })
    if (isPending) return <div>'Loading...'</div>
    if (isFetching) return <div>'Fetching...'</div>
    if (error) return <div>'An error has occurred: ' + {error.message}</div>
    const songs = data.songs
    return (
        <div className="border rounded-lg overflow-hidden shadow-sm">
            {/* Collection Header - Playlist Info */}
            <div className="p-4 bg-gray-50 border-b">
                <div className="flex gap-4 items-start">
                    {collection.imageUrl && (
                        <div className="flex-shrink-0">
                            <img
                                src={collection.imageUrl || "/placeholder.svg"}
                                alt={`${collection.title} cover`}
                                className="w-[100px] h-[100px] rounded-md object-cover shadow-sm"
                            />
                        </div>
                    )}

                    <div className="flex-1">
                        <h2 className="text-xl font-bold">{collection.title}</h2>
                        {data.description &&
                            <p className="text-sm text-gray-600 mt-1">{data.description}</p>}
                    </div>
                </div>
            </div>

            {/* Songs List Section */}
            <div className="p-4 bg-white">
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
                    {songs.length} • Songs
                </h3>

                {songs.length > 0 ? (
                    <ul className="space-y-2" role="list">
                        {songs.map((song) => (
                            <li key={song.uuid}>
                                <SongCard
                                    title={song.title}
                                    artist={song.artist}
                                    isPlaying={song === selectedSong}
                                    onClick={() => handleSongClick(song)}
                                />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                        <p>No songs in this collection</p>
                    </div>
                )}
            </div>
        </div>
    )
}
