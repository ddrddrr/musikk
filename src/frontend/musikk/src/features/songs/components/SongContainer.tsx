import { CollectionSong } from "@/features/song-collections/types.ts";
import { SongAddToLikedButton } from "@/features/songs/components/SongAddToLikedButton.tsx";
import { SongAddToQueueButton } from "@/features/songs/components/SongAddToQueueButton.tsx";
import { SongContextMenu } from "@/features/songs/components/SongContextMenu.tsx";
import { SongPlayButton } from "@/features/songs/components/SongPlayButton.tsx";
import { cn } from "@/lib/utils.ts";
import { memo } from "react";

type SongContainerSize = "compact" | "normal";

interface SongContainerProps {
    collectionSong: CollectionSong;
    size?: SongContainerSize;
    extraStyle?: string;
    renderItems?: Partial<RenderItems>;
}

interface RenderItems {
    image: boolean;
    addToQueueButton: boolean;
    addToLikedButton: boolean;
    playButton: boolean;
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
    },
};

export const SongContainer = memo(function SongContainer({
    collectionSong,
    size = "normal",
    extraStyle,
    renderItems = {},
}: SongContainerProps) {
    const {
        image = true,
        addToQueueButton = true,
        addToLikedButton = true,
        playButton = true,
        removeFromPlaylistCtxBtn = false,
    } = renderItems;

    const song = collectionSong.song;
    const authors = song.authors.map((a) => a.display_name).join(", ");
    const sizeClass = sizeConfig[size];
    const mediaBaseClass =
        "flex items-center justify-center bg-gray-200 rounded-sm border border-black overflow-hidden";

    return (
        <SongContextMenu song={collectionSong} renderRemoveFromPlaylist={removeFromPlaylistCtxBtn}>
            <div
                className={cn(
                    "flex items-center justify-between w-full overflow-hidden",
                    "bg-white border-black border-2 rounded-sm p-4",
                    "transition-colors hover:bg-gray-100",
                    sizeClass.containerGap,
                    extraStyle,
                )}
            >
                <div className={cn("flex items-center", sizeClass.containerGap)}>
                    {image &&
                        (song.image ? (
                            <div className={cn(mediaBaseClass, sizeClass.image)}>
                                <img
                                    src={song.image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className={cn(mediaBaseClass, sizeClass.image)}>
                                <span className={cn("text-gray-400", sizeClass.iconSize)}>♪</span>
                            </div>
                        ))}
                    <div className="flex flex-col min-w-0">
                        <p className={cn("font-bold text-black truncate", sizeClass.titleSize)}>
                            {song.title}
                        </p>
                        <p className={cn("text-gray-600 truncate", sizeClass.authorsSize)}>
                            {authors}
                        </p>
                    </div>
                </div>

                <div className={cn("flex items-center shrink-0", sizeClass.buttonsGap)}>
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
                </div>
            </div>
        </SongContextMenu>
    );
});
