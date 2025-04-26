import type { ISongCollection } from "@/components/song-collection/types";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface SongCollectionCardProps {
    collection: ISongCollection;
}

// TODO: create a modified version for the queue(make text here longer, there shorter)
interface SongCollectionCardProps {
    collection: ISongCollection;
    size?: "default" | "small";
}

export function SongCollectionCard({ collection, size = "default" }: SongCollectionCardProps) {
    const navigate = useNavigate();
    const { uuid, title, image } = collection;

    const cardSizeClasses = size === "small" ? "w-24" : "w-full"; // or any other smaller size you prefer
    const imageSizeClasses = size === "small" ? "aspect-square" : "aspect-square"; // can customize more if needed
    const titleClasses = size === "small" ? "text-xs" : "text-sm";

    return (
        <Card
            onClick={() => navigate(`/collection/${uuid}/`)}
            key={uuid}
            className={`cursor-pointer transition-all duration-200 py-0 border-2 border-black rounded-none overflow-hidden bg-transparent ${cardSizeClasses}`}
        >
            <CardContent className="p-0">
                {image ? (
                    <img src={image} alt={title} className={`w-full ${imageSizeClasses} object-cover`} />
                ) : (
                    <div className={`w-full ${imageSizeClasses} bg-gray-200 flex items-center justify-center`}>
                        <span className="text-gray-400 text-2xl">♪</span>
                    </div>
                )}
                <div className="p-2 bg-gray-200 border-t-2 border-black">
                    <p className={`font-bold truncate ${titleClasses}`}>{title}</p>
                </div>
            </CardContent>
        </Card>
    );
}
