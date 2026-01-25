import { CollectionSong } from "@/features/collections/types.ts";
import { SongContextMenu } from "@/features/songs/components/SongContextMenu.tsx";
import { albumBySongRetrieve } from "@/features/songs/queries.ts";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { useNavigate } from "react-router-dom";

interface SongCardProps {
    collectionSong: CollectionSong;
    size?: "small" | "medium" | "big";
    onClick?: (s: CollectionSong) => void;
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

    async function handleClick(s: CollectionSong) {
        if (onClick) {
            onClick(s);
        } else {
            const albumUUID = await albumBySongRetrieve(s.uuid);
            navigate(`/collection/${albumUUID.uuid}/`);
        }
    }
    const mediaBaseClass =
        "bg-gray-200 flex items-center justify-center rounded-sm border border-black overflow-hidden";

    return (
        <SongContextMenu song={collectionSong}>
            <Card
                onClick={() => handleClick(collectionSong)}
                key={uuid}
                variant="panel"
                size={size === "small" ? "sm" : size === "big" ? "lg" : "md"}
                className={`cursor-pointer py-0 transition-all duration-200 ${sizes.card}`}
            >
                <CardContent className="p-0">
                    {image ? (
                        <div className={`w-full ${sizes.image} ${mediaBaseClass}`}>
                            <img src={image} alt={title} className="h-full w-full object-cover" />
                        </div>
                    ) : (
                        <div className={`w-full ${sizes.image} ${mediaBaseClass}`}>
                            <span className={`text-gray-400 ${sizes.icon}`}>♪</span>
                        </div>
                    )}
                    <div className={`border-t-2 border-black bg-gray-200 ${sizes.padding}`}>
                        <p className={`truncate text-gray-600 ${sizes.authors}`}>{authorNames}</p>
                        <p className={`truncate font-bold ${sizes.title}`}>{title}</p>
                    </div>
                </CardContent>
            </Card>
        </SongContextMenu>
    );
}
