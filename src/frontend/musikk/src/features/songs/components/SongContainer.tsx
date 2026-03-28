import { cva } from "class-variance-authority";
import { CollectionSong } from "@/features/collections/types.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { SongAddToLikedButton } from "@/features/songs/components/SongAddToLikedButton.tsx";
import { SongAddToQueueButton } from "@/features/songs/components/SongAddToQueueButton.tsx";
import { SongMenuButton } from "@/features/songs/components/SongMenuButton.tsx";
import { SongPlayButton } from "@/features/songs/components/SongPlayButton.tsx";
import { cn } from "@/lib/utils.ts";
import { type ReactNode, memo } from "react";

type SongContainerSize = "compact" | "normal";
type SongContainerVariant = "inline" | "stacked";

type SongContainerProps = {
    collectionSong: CollectionSong;
    size?: SongContainerSize;
    variant?: SongContainerVariant;
    extraStyle?: string;
    renderItems?: Partial<RenderItems>;
    playButtonSlot?: ReactNode;
};

type RenderItems = {
    image: boolean;
    addToQueueButton: boolean;
    addToLikedButton: boolean;
    playButton: boolean;
    songMenuButton: boolean;
    removeFromPlaylistCtxBtn: boolean;
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

const buttonProps = {
    compact: { size: 28, padding: "p-1", gap: "gap-1", iconSize: "text-lg" },
    normal: { size: 40, padding: "p-2", gap: "gap-2", iconSize: "text-xl" },
} as const;

export const SongContainer = memo(function SongContainer({
    collectionSong,
    size = "normal",
    variant = "inline",
    extraStyle,
    renderItems = {},
    playButtonSlot,
}: SongContainerProps) {
    const {
        image = true,
        addToQueueButton = true,
        addToLikedButton = true,
        playButton = true,
        songMenuButton = true,
        removeFromPlaylistCtxBtn = false,
    } = renderItems;

    const song = collectionSong.song;
    const authors = song.authors.map((a) => a.display_name).join(", ");
    const btn = buttonProps[size];

    const playButtonElement =
        playButtonSlot ??
        (playButton && (
            <SongPlayButton
                collectionSong={collectionSong}
                size={btn.size}
                className={btn.padding}
            />
        ));

    const buttons = (
        <div className={cn("flex items-center", btn.gap)}>
            {playButtonElement}
            {addToLikedButton && (
                <SongAddToLikedButton
                    collectionSong={collectionSong}
                    size={btn.size}
                    className={btn.padding}
                />
            )}
            {addToQueueButton && (
                <SongAddToQueueButton
                    collectionSong={collectionSong}
                    size={btn.size}
                    className={btn.padding}
                />
            )}
            {songMenuButton && (
                <SongMenuButton
                    collectionSong={collectionSong}
                    size={btn.size}
                    className={btn.padding}
                    iconSize={btn.iconSize}
                    showRemoveFromPlaylist={removeFromPlaylistCtxBtn}
                />
            )}
        </div>
    );

    const gapClass = gapVariants({ size });

    const mediaAndTitle = (
        <div className={cn("flex min-w-0 items-center", gapClass)}>
            {image && <MediaThumbnail src={song.image} className={imageVariants({ size })} />}
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
                    <div className={cn("flex flex-1", gapClass)}>{buttons}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={containerVariants({ size, variant, className: extraStyle })}>
            {mediaAndTitle}
            <div className="shrink-0">{buttons}</div>
        </div>
    );
});
