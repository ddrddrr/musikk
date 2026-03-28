import { cva } from "class-variance-authority";
import { CollectionContextMenu } from "@/features/collections/components/CollectionContextMenu.tsx";
import type { Collection } from "@/features/collections/types.ts";
import {
    type CardSize,
    cardPaddingVariants,
    cardSubtitleVariants,
    cardTitleVariants,
} from "@/features/common/card-variants.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { useNavigate } from "react-router-dom";

type CollectionCardProps = {
    collection: Collection;
    size?: CardSize;
    onClick?: (c: Collection) => void;
};

const collectionCardWidthVariants = cva("", {
    variants: {
        size: {
            small: "w-25",
            medium: "w-35",
            big: "w-60",
        },
    },
    defaultVariants: { size: "medium" },
});

const collectionCardImageVariants = cva("w-full", {
    variants: {
        size: {
            small: "h-20",
            medium: "h-30",
            big: "h-55",
        },
    },
    defaultVariants: { size: "medium" },
});

const spacingBySize: Record<CardSize, "sm" | "md" | "lg"> = {
    small: "sm",
    medium: "md",
    big: "lg",
};

export function CollectionCard({
    collection,
    size = "medium",
    onClick = undefined,
}: CollectionCardProps) {
    const navigate = useNavigate();
    const { uuid, title, image, authors } = collection;

    const authorNames = authors.map((a) => a.display_name).join(", ");

    function handleOnClick(collection: Collection) {
        if (onClick) {
            onClick(collection);
        } else {
            void navigate(`/collection/${collection.uuid}/`);
        }
    }

    return (
        <CollectionContextMenu collection={collection}>
            <Card
                onClick={() => handleOnClick(collection)}
                key={uuid}
                variant="panel"
                spacing={spacingBySize[size]}
                className={collectionCardWidthVariants({ size, className: "cursor-pointer py-0 transition-all duration-200" })}
            >
                <CardContent className="p-0">
                    <MediaThumbnail
                        src={image}
                        alt={title}
                        className={collectionCardImageVariants({ size })}
                    />
                    <div className={cardPaddingVariants({ size })}>
                        <p className={cardSubtitleVariants({ size })}>{authorNames}</p>
                        <p className={cardTitleVariants({ size })}>{title}</p>
                    </div>
                </CardContent>
            </Card>
        </CollectionContextMenu>
    );
}
