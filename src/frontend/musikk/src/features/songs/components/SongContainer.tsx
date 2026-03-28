import { cva } from "class-variance-authority";
import { CollectionSong } from "@/features/collections/types.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { DefaultSongActions } from "@/features/songs/components/DefaultSongActions.tsx";
import { cn } from "@/lib/utils.ts";
import { type ReactNode, memo } from "react";

type SongContainerSize = "compact" | "normal";
type SongContainerVariant = "inline" | "stacked";

type SongContainerProps = {
    collectionSong: CollectionSong;
    size?: SongContainerSize;
    variant?: SongContainerVariant;
    extraStyle?: string;
    showImage?: boolean;
    actions?: ReactNode;
};

const containerVariants = cva(
    "w-full overflow-hidden rounded-sm border-2 border-black bg-white transition-colors hover:bg-gray-100",
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
            compact: "w-8 h-8",
            normal: "w-10 h-10",
        },
    },
    defaultVariants: { size: "normal" },
});

const titleVariants = cva("truncate font-bold text-black", {
    variants: {
        size: {
            compact: "text-xs",
            normal: "text-sm",
        },
    },
    defaultVariants: { size: "normal" },
});

const authorsVariants = cva("truncate text-gray-600", {
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
    extraStyle,
    showImage = true,
    actions,
}: SongContainerProps) {
    const song = collectionSong.song;
    const authors = song.authors.map((a) => a.display_name).join(", ");

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
                    <p className={authorsVariants({ size })}>{authors}</p>
                )}
            </div>
        </div>
    );

    if (variant === "stacked") {
        return (
            <div className={containerVariants({ size, variant, className: extraStyle })}>
                {mediaAndTitle}
                <div className="flex">
                    <div className={cn("shrink-0", imageVariants({ size }))} />
                    <div className={cn("flex flex-1", gapClass)}>{renderedActions}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={containerVariants({ size, variant, className: extraStyle })}>
            {mediaAndTitle}
            <div className="shrink-0">{renderedActions}</div>
        </div>
    );
});
