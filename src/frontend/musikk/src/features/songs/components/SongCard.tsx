import { CollectionSong } from "@/features/collections/types.ts";
import {
    type CardSize,
    cardPaddingVariants,
    cardSubtitleVariants,
    cardTitleVariants,
} from "@/features/common/card-variants.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { SongContextMenu } from "@/features/songs/components/SongContextMenu.tsx";
import { useNavigateToSongAlbum } from "@/features/songs/hooks/useNavigateToSongAlbum.ts";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";
import { cva } from "class-variance-authority";

type SongCardProps = {
    collectionSong: CollectionSong;
    size?: CardSize;
    onClick?: (s: CollectionSong) => void;
};

const songCardWidthVariants = cva("", {
    variants: {
        size: {
            small: "w-25",
            medium: "w-35",
            big: "w-60",
        },
    },
    defaultVariants: { size: "medium" },
});

const songCardImageVariants = cva("w-full", {
    variants: {
        size: {
            small: "h-20",
            medium: "h-35",
            big: "h-60",
        },
    },
    defaultVariants: { size: "medium" },
});

export function SongCard({ collectionSong, size = "medium", onClick = undefined }: SongCardProps) {
    const navigateToAlbum = useNavigateToSongAlbum();
    const { uuid, title, authors, image } = collectionSong.song;

    function handleClick(s: CollectionSong) {
        if (onClick) {
            onClick(s);
            return;
        }
        void navigateToAlbum(s.uuid);
    }

    return (
        <SongContextMenu song={collectionSong}>
            <Card
                onClick={() => void handleClick(collectionSong)}
                key={uuid}
                variant="panel"
                className={songCardWidthVariants({
                    size,
                    className: "cursor-pointer py-0 transition-all duration-200",
                })}
            >
                <CardContent className="p-0">
                    <MediaThumbnail
                        src={image}
                        alt={title}
                        className={songCardImageVariants({ size })}
                    />
                    <div className={cardPaddingVariants({ size })}>
                        <AuthorLinks authors={authors} className={cardSubtitleVariants({ size })} />
                        <p className={cardTitleVariants({ size })}>{title}</p>
                    </div>
                </CardContent>
            </Card>
        </SongContextMenu>
    );
}
