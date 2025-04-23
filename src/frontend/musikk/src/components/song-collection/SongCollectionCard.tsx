import type { ISongCollection } from "@/components/song-collection/types";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface SongCollectionCardProps {
    collection: ISongCollection;
}

// TODO: create a modified version for the queue(make text here longer, there shorter)
export function SongCollectionCard({ collection }: SongCollectionCardProps) {
    const navigate = useNavigate();
    const { uuid, title, image } = collection;

    return (
        <Card
            onClick={() => navigate(`/collection/${uuid}/`)}
            key={uuid}
            className="cursor-pointer
            transition-all duration-200
            py-0 border-2 border-black rounded-none
            overflow-hidden bg-transparent w-full"
        >
            <CardContent className="p-0">
                {image ? (
                    <img
                        src={image || "/placeholder.svg?height=150&width=150"}
                        alt={title}
                        className="w-full aspect-square object-cover"
                    />
                ) : (
                    <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-4xl">♪</span>
                    </div>
                )}
                <div className="p-2 bg-gray-200 border-t-2 border-black">
                    <p className="font-bold text-sm truncate">{title}</p>
                </div>
            </CardContent>
        </Card>
    );
}
