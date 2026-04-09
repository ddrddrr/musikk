import { cva } from "class-variance-authority";
import { CollectionSong } from "@/features/collections/types.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { DefaultSongActions } from "@/features/songs/components/DefaultSongActions.tsx";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";
import { cn } from "@/lib/utils.ts";
import { type ReactNode, memo } from "react";

type SongContainerSize = "compact" | "normal";
type SongContainerVariant = "inline" | "stacked";

type SongContainerProps = {
    collectionSong: CollectionSong;
    size?: SongContainerSize;
    variant?: SongContainerVariant;
    className?: string;
    showImage?: boolean;
    actions?: ReactNode;
};

const containerVariants = cva(
    "w-full overflow-hidden rounded-sm border-2 border-foreground bg-card transition-colors hover:bg-muted",
    {
        variants: {
            size: {
                compact: "p-3 gap-2",
                normal: "p-4 gap-4",
            },
            variant: {
                inline: "flex items-center justify-between",
                stacked: "flex flex-col",
            },
        },
        defaultVariants: { size: "normal", variant: "inline" },
    },
);

const imageVariants = cva("", {
    variants: {
        size: {
            compact: "size-8",
            normal: "size-10",
        },
    },
    defaultVariants: { size: "normal" },
});

const titleVariants = cva("truncate font-bold text-foreground", {
    variants: {
        size: {
            compact: "text-xs",
            normal: "text-sm",
        },
    },
    defaultVariants: { size: "normal" },
});

const authorsVariants = cva("truncate text-muted-foreground", {
    variants: {
        size: {
            compact: "text-[10px]",
            normal: "text-xs",
        },
    },
    defaultVariants: { size: "normal" },
});

const gapVariants = cva("", {
    variants: {
        size: {
            compact: "gap-2",
            normal: "gap-4",
        },
    },
    defaultVariants: { size: "normal" },
});

export const SongContainer = memo(function SongContainer({
    collectionSong,
    size = "normal",
    variant = "inline",
    className,
    showImage = true,
    actions,
}: SongContainerProps) {
    const song = collectionSong.song;

    const renderedActions = actions ?? (
        <DefaultSongActions collectionSong={collectionSong} size={size} />
    );

    const gapClass = gapVariants({ size });

    const mediaAndTitle = (
        <div className={cn("flex min-w-0 items-center", gapClass)}>
            {showImage && <MediaThumbnail src={song.image} className={imageVariants({ size })} />}
            <div className="flex min-w-0 flex-col">
                <p className={titleVariants({ size })}>{song.title}</p>
                {variant === "inline" && (
                    <AuthorLinks authors={song.authors} className={authorsVariants({ size })} />
                )}
            </div>
        </div>
    );

    if (variant === "stacked") {
        return (
            <div className={cn(containerVariants({ size, variant }), className)}>
                {mediaAndTitle}
                <div className="flex">
                    <div className={cn("shrink-0", imageVariants({ size }))} />
                    <div className={cn("flex flex-1", gapClass)}>{renderedActions}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(containerVariants({ size, variant }), className)}>
            {mediaAndTitle}
            <div className="shrink-0">{renderedActions}</div>
        </div>
    );
});
