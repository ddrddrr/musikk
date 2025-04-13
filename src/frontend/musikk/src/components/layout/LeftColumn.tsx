"use client"

import {SongCollectionCard} from "@/components/song-collection/SongCollectionCard"
import type {ISongCollection} from "@/components/song-collection/types"

interface LeftColumnProps {
    collections: ISongCollection[]
    setSelectedCollection: (collection: ISongCollection) => void
}

export function LeftColumn({collections, setSelectedCollection}: LeftColumnProps) {
    return (
        <div className="w-1/5 p-4 bg-red-600 overflow-y-auto">
            {collections && collections.length > 0 ? (
                <ul className="space-y-6" role="list">
                    {collections.map((collection) => (
                        <li key={collection.uuid}>
                            <SongCollectionCard collection={collection} setSelectedCollection={setSelectedCollection}/>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8 text-white bg-red-500 rounded-md">
                    <p>No song collections found</p>
                </div>
            )}
        </div>
    )
}
