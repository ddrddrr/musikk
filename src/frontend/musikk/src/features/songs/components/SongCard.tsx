import { CollectionSong } from "@/features/collections/types.ts";
import {
    type CardSize,
    cardPaddingVariants,
    cardSubtitleVariants,
    cardTitleVariants,
} from "@/features/common/card-variants.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { StretchedLink } from "@/features/common/StretchedLink.tsx";
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
            sm: "w-25",
            md: "w-35",
            lg: "w-60",
        },
    },
    defaultVariants: { size: "md" },
});

const songCardImageVariants = cva("w-full", {
    variants: {
        size: {
            sm: "h-20",
            md: "h-35",
            lg: "h-60",
        },
    },
    defaultVariants: { size: "md" },
});

export function SongCard({ collectionSong, size = "md", onClick = undefined }: SongCardProps) {
    const navigateToAlbum = useNavigateToSongAlbum();
    const { uuid, title, authors, image } = collectionSong.song;

    function handleClick() {
        if (onClick) {
            onClick(collectionSong);
            return;
        }
        void navigateToAlbum(uuid);
    }

    return (
        <SongContextMenu song={collectionSong}>
            <Card
                key={uuid}
                variant="panel"
                className={songCardWidthVariants({
                    size,
                    className: "relative py-0 transition-all duration-200",
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
                        <p className={cardTitleVariants({ size })}>
                            <StretchedLink onClick={handleClick}>{title}</StretchedLink>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </SongContextMenu>
    );
}
