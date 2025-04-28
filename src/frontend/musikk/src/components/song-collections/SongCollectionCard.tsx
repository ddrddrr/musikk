import type { ISongCollection } from "@/components/song-collections/types";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface SongCollectionCardProps {
    collection: ISongCollection;
    size?: "small" | "medium" | "big";
}

const sizeClasses = {
    small: {
        card: "w-full",
        image: "aspect-square",
        title: "text-sm",
        icon: "text-xl",
        padding: "p-1",
    },
    medium: {
        card: "w-full",
        image: "aspect-square",
        title: "text-base",
        icon: "text-2xl",
        padding: "p-2",
    },
    big: {
        card: "w-full",
        image: "aspect-square",
        title: "text-xl",
        icon: "text-3xl",
        padding: "p-3",
    },
};

export function SongCollectionCard({ collection, size = "medium" }: SongCollectionCardProps) {
    const navigate = useNavigate();
    const { uuid, title, image } = collection;
    const sizes = sizeClasses[size];

    return (
        <Card
            onClick={() => navigate(`/collection/${uuid}/`)}
            key={uuid}
            className={`cursor-pointer transition-all duration-200 py-0 border-2 border-black rounded-sm overflow-hidden bg-gray-50 ${sizes.card}`}
        >
            <CardContent className="p-0">
                {image ? (
                    <img src={image} alt={title} className={`w-full ${sizes.image} object-cover`} />
                ) : (
                    <div className={`w-full ${sizes.image} bg-gray-200 flex items-center justify-center`}>
                        <span className={`text-gray-400 ${sizes.icon}`}>♪</span>
                    </div>
                )}
                <div className={`bg-gray-200 border-t-2 border-black ${sizes.padding}`}>
                    <p className={`font-bold truncate ${sizes.title}`}>{title}</p>
                </div>
            </CardContent>
        </Card>
    );
}
