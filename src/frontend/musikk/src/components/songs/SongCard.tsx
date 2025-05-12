import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface SongCardProps {
    collectionSong: ISongCollectionSong;
    size?: "small" | "medium" | "big";
}

const sizeClasses = {
    small: {
        card: "w-full",
        image: "aspect-square",
        title: "text-sm",
        artist: "text-xs italic",
        icon: "text-xl",
        padding: "p-1",
    },
    medium: {
        card: "w-full",
        image: "aspect-square",
        title: "text-base",
        artist: "text-base italic",
        icon: "text-2xl",
        padding: "p-2",
    },
    big: {
        card: "w-full",
        image: "aspect-square",
        title: "text-xl",
        artist: "text-base italic",
        icon: "text-3xl",
        padding: "p-3",
    },
};

export function SongCard({ collectionSong, size = "medium" }: SongCardProps) {
    const navigate = useNavigate();
    const sizes = sizeClasses[size];
    const { uuid, title, authors, image } = collectionSong.song;

    const authorNames = authors.map((a) => a.display_name).join(", ");

    return (
        <Card
            onClick={() => navigate(`/song/${uuid}/`)}
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
                    <p className={`truncate text-gray-600 ${sizes.artist}`}>{authorNames}</p>
                    <p className={`font-bold truncate ${sizes.title}`}>{title}</p>
                </div>
            </CardContent>
        </Card>
    );
}
