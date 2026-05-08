import { CollectionSong } from "@/features/collections/types.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { DefaultSongActions } from "@/features/songs/components/DefaultSongActions.tsx";
import { useNavigateToSongAlbum } from "@/features/songs/hooks/useNavigateToSongAlbum.ts";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";
import { cn } from "@/lib/utils.ts";
import { formatDuration } from "@/utils/formatDuration.ts";
import { cva } from "class-variance-authority";
import { type ReactNode } from "react";

type SongContainerSize = "compact" | "normal";
type SongContainerVariant = "inline" | "stacked";

type SongContainerProps = {
    collectionSong: CollectionSong;
    size?: SongContainerSize;
    variant?: SongContainerVariant;
    className?: string;
    showImage?: boolean;
    showDuration?: boolean;
    actions?: ReactNode;
};

const containerVariants = cva(
    "w-full overflow-hidden rounded-sm border-2 border-foreground bg-card transition-colors hover:bg-muted-hover",
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

const durationVariants = cva("tabular-nums text-muted-foreground", {
    variants: {
        size: {
            compact: "text-[10px]",
            normal: "text-xs",
        },
    },
    defaultVariants: { size: "normal" },
});

const gapClass = { compact: "gap-2", normal: "gap-4" } as const;

export function SongContainer({
    collectionSong,
    size = "normal",
    variant = "inline",
    className,
    showImage = true,
    showDuration = false,
    actions,
}: SongContainerProps) {
    const song = collectionSong.song;
    const navigateToAlbum = useNavigateToSongAlbum();

    const renderedActions = actions ?? (
        <DefaultSongActions collectionSong={collectionSong} size={size} />
    );

    const mediaAndTitle = (
        <div className={cn("flex min-w-0 items-center", gapClass[size])}>
            {showImage && <MediaThumbnail src={song.image} className={imageVariants({ size })} />}
            <div className="flex min-w-0 flex-col">
                {/*TODO: unify with other clickable names which are links?*/}
                <button
                    type="button"
                    onClick={() => void navigateToAlbum(collectionSong.uuid)}
                    className={cn(
                        titleVariants({ size }),
                        "cursor-pointer bg-transparent p-0 text-left hover:underline",
                    )}
                >
                    {song.title}
                </button>
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
                    <div className={cn("flex flex-1", gapClass[size])}>{renderedActions}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(containerVariants({ size, variant }), className)}>
            {mediaAndTitle}
            <div className={cn("flex shrink-0 items-center", gapClass[size])}>
                {showDuration && song.duration_ms != null && (
                    <span className={durationVariants({ size })}>
                        {formatDuration(song.duration_ms)}
                    </span>
                )}
                <div>{renderedActions}</div>
            </div>
        </div>
    );
}
