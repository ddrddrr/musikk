import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { SongAddToLikedButton } from "@/components/songs/SongAddToLikedButton.tsx";
import { SongAddToQueueButton } from "@/components/songs/SongAddToQueueButton.tsx";
import { SongContextMenu } from "@/components/songs/SongContextMenu.tsx";
import { SongPlayButton } from "@/components/songs/SongPlayButton";
import { MediaBox } from "@/components/ui/media";
import { cn } from "@/lib/utils";
import { memo } from "react";

type SongContainerSize = "compact" | "normal" | "comfortable";

interface SongContainerProps {
    collectionSong: ISongCollectionSong;
    size?: SongContainerSize;
    className?: string;
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
        container: "gap-2",
        image: "w-8 h-8",
        title: "text-xs",
        authors: "text-[10px]",
        icon: "text-lg",
        buttons: "gap-1",
        buttonSize: 28,
        buttonClass: "p-1",
    },
    normal: {
        container: "gap-3",
        image: "w-10 h-10",
        title: "text-sm",
        authors: "text-xs",
        icon: "text-xl",
        buttons: "gap-2",
        buttonSize: 40,
        buttonClass: "p-2",
    },
    comfortable: {
        container: "gap-4",
        image: "w-12 h-12",
        title: "text-base",
        authors: "text-sm",
        icon: "text-2xl",
        buttons: "gap-2",
        buttonSize: 48,
        buttonClass: "p-2",
    },
};

export const SongContainer = memo(function SongContainer({
    collectionSong,
    size = "normal",
    className,
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
    const config = sizeConfig[size];

    return (
        <SongContextMenu song={collectionSong} renderRemoveFromPlaylist={removeFromPlaylistCtxBtn}>
            <div
                className={cn(
                    "flex items-center justify-between w-full overflow-hidden",
                    config.container,
                    className,
                )}
            >
                <div className={cn("flex items-center min-w-0", config.container)}>
                    {image &&
                        (song.image ? (
                            <MediaBox className={config.image} asChild>
                                <img src={song.image} alt="" className="w-1/2 h-1/2 object-cover" />
                            </MediaBox>
                        ) : (
                            <MediaBox className={config.image}>
                                <span className={cn("text-gray-400", config.icon)}>♪</span>
                            </MediaBox>
                        ))}

                    <div className="flex flex-col min-w-0">
                        <p className={cn("font-bold text-black truncate", config.title)}>
                            {song.title}
                        </p>
                        <p className={cn("text-gray-600 truncate", config.authors)}>{authors}</p>
                    </div>
                </div>

                <div className={cn("flex items-center shrink-0", config.buttons)}>
                    {playButton && (
                        <SongPlayButton
                            collectionSong={collectionSong}
                            size={config.buttonSize}
                            className={config.buttonClass}
                        />
                    )}
                    {addToLikedButton && (
                        <SongAddToLikedButton
                            collectionSong={collectionSong}
                            size={config.buttonSize}
                            className={config.buttonClass}
                        />
                    )}
                    {addToQueueButton && (
                        <SongAddToQueueButton
                            collectionSong={collectionSong}
                            size={config.buttonSize}
                            className={config.buttonClass}
                        />
                    )}
                </div>
            </div>
        </SongContextMenu>
    );
});
