import { ICollectionSong } from "@/modules/song-collections/types.ts";
import { albumBySongRetrieve } from "@/modules/songs/queries.ts";
import { SongContextMenu } from "@/modules/songs/SongContextMenu.tsx";
import { Card, CardContent } from "@/modules/ui/card";
import { MediaBox } from "@/modules/ui/media";
import { useNavigate } from "react-router-dom";

interface SongCardProps {
    collectionSong: ICollectionSong;
    size?: "small" | "medium" | "big";
    onClick?: (s: ICollectionSong) => void;
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

    async function handleClick(s: ICollectionSong) {
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
                variant="panel"
                size={size === "small" ? "sm" : size === "big" ? "lg" : "md"}
                className={`cursor-pointer transition-all duration-200 py-0 ${sizes.card}`}
            >
                <CardContent className="p-0">
                    {image ? (
                        <MediaBox className={`w-full ${sizes.image}`} asChild>
                            <img src={image} alt={title} className="w-full h-full object-cover" />
                        </MediaBox>
                    ) : (
                        <MediaBox className={`w-full ${sizes.image}`}>
                            <span className={`text-gray-400 ${sizes.icon}`}>♪</span>
                        </MediaBox>
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
