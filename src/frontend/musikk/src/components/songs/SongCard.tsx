import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { albumBySongRetrieve } from "@/components/songs/queries.ts";
import { SongContextMenu } from "@/components/songs/SongContextMenu.tsx";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface SongCardProps {
    collectionSong: ISongCollectionSong;
    size?: "small" | "medium" | "big";
    onClick?: (s: ISongCollectionSong) => void;
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
        image: "h-35",
        title: "text-base",
        authors: "text-sm",
        icon: "text-2xl",
        padding: "p-2",
    },
    big: {
        card: "w-60",
        image: "h-60",
        title: "text-xl",
        authors: "text-base",
        icon: "text-3xl",
        padding: "p-3",
    },
};

export function SongCard({ collectionSong, size = "medium", onClick = undefined }: SongCardProps) {
    const navigate = useNavigate();
    const sizes = sizeClasses[size];
    const { uuid, title, authors, image } = collectionSong.song;

    const authorNames = authors.map((a) => a.display_name).join(", ");

    async function handleClick(s: ISongCollectionSong) {
        if (onClick) {
            onClick(s);
        } else {
            const albumUUID = await albumBySongRetrieve(s.uuid);
            navigate(`/collection/${albumUUID.uuid}/`);
        }
    }

    return (
        <SongContextMenu song={collectionSong}>
            <Card
                onClick={() => handleClick(collectionSong)}
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
                        <p className={`truncate text-gray-600 ${sizes.authors}`}>{authorNames}</p>
                        <p className={`font-bold truncate ${sizes.title}`}>{title}</p>
                    </div>
                </CardContent>
            </Card>
        </SongContextMenu>
    );
}
