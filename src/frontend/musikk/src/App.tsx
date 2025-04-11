import {useRef, useState} from "react";
import {useQuery} from "@tanstack/react-query";

import {Player} from "./components/player/Player.tsx"
import {ISong} from "./components/song/types.ts"
import {SongCollectionContainer} from "./components/song-collection/SongCollectionContainer.tsx"
import {ISongCollection} from "@/components/song-collection/types.ts";
import {fetchCollectionList} from "@/components/song-collection/queries.ts";
import {SongCollectionCard} from "@/components/song-collection/SongCollectionCard.tsx";

export function App() {
    const [selectedSong, setSelectedSong] = useState<ISong | null>(null)
    const [selectedCollection, setSelectedCollection] = useState<ISongCollection | null>(null)
    const {isPending, error, data, isFetching} = useQuery({
        queryKey: ["collectionList"],
        queryFn: () => fetchCollectionList()
    })
    if (isPending) return <div>'Loading...'</div>
    if (isFetching) return <div>'Fetching...'</div>
    if (error) return <div>'An error has occurred: ' + {error.message}</div>

    function handleSongClick(song: ISong) {
        setSelectedSong(prev => prev === song ? null : song)
    }

    return (
        <>
            <Player url={selectedSong ? selectedSong.mpd : null}/>

            {data.length > 0 ? (
                <ul className="space-y-2" role="list">
                    {data.map((collection) => (
                        <li key={collection.uuid}>
                            <SongCollectionCard
                                collection={collection}
                                setSelectedCollection={setSelectedCollection}
                            />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                    <p>No song collections found</p>
                </div>
            )}

            {selectedCollection &&
                <SongCollectionContainer
                    collection={selectedCollection}
                    selectedSong={selectedSong}
                    handleSongClick={handleSongClick}
                />
            }
        </>
    )
}