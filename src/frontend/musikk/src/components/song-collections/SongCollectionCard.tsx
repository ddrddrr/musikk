import type { ISongCollection } from "@/components/song-collections/types";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface SongCollectionCardProps {
    collection: ISongCollection;
    size?: "small" | "medium" | "big";
    onClick?: (c: ISongCollection) => void;
}

const sizeClasses = {
    small: {
        card: "w-25",
        image: "h-20",
        title: "text-sm",
        authors: "text-xs",
        icon: "text-xl",
        padding: "p-1",
    },
    medium: {
        card: "w-35",
        image: "h-30",
        title: "text-base",
        authors: "text-sm",
        icon: "text-2xl",
        padding: "p-2",
    },
    big: {
        card: "w-60",
        image: "h-55",
        title: "text-xl",
        authors: "text-base",
        icon: "text-3xl",
        padding: "p-3",
    },
};

export function SongCollectionCard({ collection, size = "medium", onClick = undefined }: SongCollectionCardProps) {
    const navigate = useNavigate();
    const { uuid, title, image, authors } = collection;
    const sizes = sizeClasses[size];

    const authorNames = authors.map((a) => a.display_name).join(", ");

    function handleOnClick(collection: ISongCollection) {
        if (onClick) {
            onClick(collection);
        } else {
            navigate(`/collection/${collection.uuid}/`);
        }
    }

    return (
        <Card
            onClick={() => handleOnClick(collection)}
            key={uuid}
            className={`cursor-pointer transition-all duration-200 py-0 
            border-2 border-black rounded-sm overflow-hidden bg-gray-50 ${sizes.card}`}
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
                    <p className={`truncate text-gray-600 ${sizes.authors}`}>{authorNames}</p>
                    <p className={`font-bold truncate ${sizes.title}`}>{title}</p>
                </div>
            </CardContent>
        </Card>
    );
}
