import { getErrorDetail } from "@/api/errorUtils.ts";
import { cva } from "class-variance-authority";
import { CollectionSong } from "@/features/collections/types.ts";
import {
    type CardSize,
    cardPaddingVariants,
    cardSubtitleVariants,
    cardTitleVariants,
} from "@/features/common/card-variants.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { SongContextMenu } from "@/features/songs/components/SongContextMenu.tsx";
import { albumBySongRetrieve } from "@/features/songs/queries.ts";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
    const navigate = useNavigate();
    const { uuid, title, authors, image } = collectionSong.song;

    async function handleClick(s: CollectionSong) {
        if (onClick) {
            onClick(s);
            return;
        }
        try {
            const albumUUID = await albumBySongRetrieve(s.uuid);
            void navigate(`/collection/${albumUUID.uuid}/`);
        } catch (error) {
            toast.error(getErrorDetail(error, "Failed to load album"));
        }
    }

    return (
        <SongContextMenu song={collectionSong}>
            <Card
                onClick={() => void handleClick(collectionSong)}
                key={uuid}
                variant="panel"
                className={songCardWidthVariants({ size, className: "cursor-pointer py-0 transition-all duration-200" })}
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
