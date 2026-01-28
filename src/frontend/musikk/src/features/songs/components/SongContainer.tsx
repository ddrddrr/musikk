import { CollectionSong } from "@/features/collections/types.ts";
import { SongAddToLikedButton } from "@/features/songs/components/SongAddToLikedButton.tsx";
import { SongAddToQueueButton } from "@/features/songs/components/SongAddToQueueButton.tsx";
import { SongMenuButton } from "@/features/songs/components/SongMenuButton.tsx";
import { SongPlayButton } from "@/features/songs/components/SongPlayButton.tsx";
import { cn } from "@/lib/utils.ts";
import { memo } from "react";

type SongContainerSize = "compact" | "normal";
type SongContainerVariant = "inline" | "stacked";

interface SongContainerProps {
    collectionSong: CollectionSong;
    size?: SongContainerSize;
    variant?: SongContainerVariant;
    extraStyle?: string;
    renderItems?: Partial<RenderItems>;
}

interface RenderItems {
    image: boolean;
    addToQueueButton: boolean;
    addToLikedButton: boolean;
    playButton: boolean;
    songMenuButton: boolean;
    removeFromPlaylistCtxBtn: boolean;
}

const sizeConfig = {
    compact: {
        containerGap: "gap-2",
        image: "w-8 h-8",
        titleSize: "text-xs",
        authorsSize: "text-[10px]",
        iconSize: "text-lg",
        buttonsGap: "gap-1",
        buttonSize: 28,
        buttonPadding: "p-1",
        containerPadding: "p-3",
    },
    normal: {
        containerGap: "gap-4",
        image: "w-10 h-10",
        titleSize: "text-sm",
        authorsSize: "text-xs",
        iconSize: "text-xl",
        buttonsGap: "gap-2",
        buttonSize: 40,
        buttonPadding: "p-2",
        containerPadding: "p-4",
    },
};

export const SongContainer = memo(function SongContainer({
    collectionSong,
    size = "normal",
    variant = "inline",
    extraStyle,
    renderItems = {},
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
    const sizeClass = sizeConfig[size];
    const mediaBaseClass =
        "flex items-center justify-center bg-gray-200 rounded-sm border border-black overflow-hidden";

    const buttons = (
        <div className={cn("flex items-center", sizeClass.buttonsGap)}>
            {playButton && (
                <SongPlayButton
                    collectionSong={collectionSong}
                    size={sizeClass.buttonSize}
                    className={sizeClass.buttonPadding}
                />
            )}
            {addToLikedButton && (
                <SongAddToLikedButton
                    collectionSong={collectionSong}
                    size={sizeClass.buttonSize}
                    className={sizeClass.buttonPadding}
                />
            )}
            {addToQueueButton && (
                <SongAddToQueueButton
                    collectionSong={collectionSong}
                    size={sizeClass.buttonSize}
                    className={sizeClass.buttonPadding}
                />
            )}
            {songMenuButton && (
                <SongMenuButton
                    collectionSong={collectionSong}
                    size={sizeClass.buttonSize}
                    className={sizeClass.buttonPadding}
                    iconSize={sizeClass.iconSize}
                    showRemoveFromPlaylist={removeFromPlaylistCtxBtn}
                />
            )}
        </div>
    );

    return (
        <div
            className={cn(
                "w-full overflow-hidden",
                "rounded-sm border-2 border-black bg-white",
                "transition-colors hover:bg-gray-100",
                sizeClass.containerPadding,
                variant === "stacked"
                    ? cn("flex flex-col", sizeClass.containerGap)
                    : cn("flex items-center justify-between", sizeClass.containerGap),
                extraStyle,
            )}
        >
            {variant === "stacked" ? (
                <>
                    <div className={cn("flex min-w-0 items-center", sizeClass.containerGap)}>
                        {image &&
                            (song.image ? (
                                <div className={cn(mediaBaseClass, sizeClass.image)}>
                                    <img
                                        src={song.image}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className={cn(mediaBaseClass, sizeClass.image)}>
                                    <span className={cn("text-gray-400", sizeClass.iconSize)}>
                                        ♪
                                    </span>
                                </div>
                            ))}

                        <div className="flex min-w-0 flex-col">
                            <p className={cn("truncate font-bold text-black", sizeClass.titleSize)}>
                                {song.title}
                            </p>
                        </div>
                    </div>

                    <div className="flex">
                        {image ? (
                            <div className={cn("shrink-0", sizeClass.image)} />
                        ) : (
                            <div className={cn("shrink-0", sizeClass.image)} />
                        )}
                        <div className={cn("flex flex-1", sizeClass.containerGap)}>{buttons}</div>
                    </div>
                </>
            ) : (
                <>
                    <div className={cn("flex min-w-0 items-center", sizeClass.containerGap)}>
                        {image &&
                            (song.image ? (
                                <div className={cn(mediaBaseClass, sizeClass.image)}>
                                    <img
                                        src={song.image}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className={cn(mediaBaseClass, sizeClass.image)}>
                                    <span className={cn("text-gray-400", sizeClass.iconSize)}>
                                        ♪
                                    </span>
                                </div>
                            ))}

                        <div className="flex min-w-0 flex-col">
                            <p className={cn("truncate font-bold text-black", sizeClass.titleSize)}>
                                {song.title}
                            </p>
                            <p className={cn("truncate text-gray-600", sizeClass.authorsSize)}>
                                {authors}
                            </p>
                        </div>
                    </div>

                    <div className="shrink-0">{buttons}</div>
                </>
            )}
        </div>
    );
});
