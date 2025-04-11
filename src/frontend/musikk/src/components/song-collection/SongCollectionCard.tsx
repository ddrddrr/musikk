"use client"

import { Card, CardHeader, CardContent } from "@/components/ui/card"
import type { ISongCollection } from "@/components/song-collection/types"

interface SongCollectionCardProps {
    collection: ISongCollection
    setSelectedCollection: (collection: ISongCollection) => void
}

export function SongCollectionCard({ collection, setSelectedCollection }: SongCollectionCardProps) {
    const { uuid, title, image } = collection

    const handleClick = () => {
        setSelectedCollection(collection)
    }

    return (
        <Card onClick={handleClick} key={uuid} className="cursor-pointer hover:shadow-md transition-all duration-200">
            <CardHeader className="font-bold pb-2">{title}</CardHeader>
            <CardContent className="pt-0">
                {image ? (
                    <img
                        src={image || "/placeholder.svg"}
                        alt={title}
                        className="w-25 h-auto aspect-square object-cover"
                    />
                ) : (
                    <div className="w-full aspect-square bg-gray-200 flex items-center justify-center rounded">
                        <span className="text-gray-400 text-4xl">♪</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
