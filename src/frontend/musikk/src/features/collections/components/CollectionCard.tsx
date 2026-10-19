import { CollectionContextMenu } from "@/features/collections/components/CollectionContextMenu.tsx";
import type { Collection } from "@/features/collections/types.ts";
import {
    type CardSize,
    cardPaddingVariants,
    cardSubtitleVariants,
    cardTitleVariants,
} from "@/features/common/card-variants.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { StretchedLink } from "@/features/common/StretchedLink.tsx";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

type CollectionCardProps = {
    collection: Collection;
    size?: CardSize;
    className?: string;
    onClick?: (c: Collection) => void;
};

const collectionCardWidthVariants = cva("", {
    variants: {
        size: {
            sm: "w-25",
            md: "w-35",
            lg: "w-60",
        },
    },
    defaultVariants: { size: "md" },
});

export function CollectionCard({
    collection,
    size = "md",
    className,
    onClick = undefined,
}: CollectionCardProps) {
    const { uuid, title, image, authors } = collection;

    return (
        <CollectionContextMenu collection={collection}>
            <Card
                key={uuid}
                variant="panel"
                spacing={size}
                className={cn(
                    collectionCardWidthVariants({ size }),
                    "relative py-0 transition-all duration-200",
                    className,
                )}
            >
                <CardContent className="p-0">
                    <MediaThumbnail src={image} alt={title} className="aspect-square w-full" />
                    <div className={cardPaddingVariants({ size })}>
                        <AuthorLinks authors={authors} className={cardSubtitleVariants({ size })} />
                        <p className={cardTitleVariants({ size })}>
                            <StretchedLink
                                to={`/collection/${uuid}/`}
                                onClick={onClick && (() => onClick(collection))}
                            >
                                {title}
                            </StretchedLink>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </CollectionContextMenu>
    );
}
