import { SongQueueNode } from "@/features/song-queue/api/types.ts";
import { SongQueuePlayButton } from "@/features/song-queue/components/SongQueueContainerPlayButton.tsx";
import { SongAddToLikedButton } from "@/features/songs/components/SongAddToLikedButton.tsx";
import { SongAddToQueueButton } from "@/features/songs/components/SongAddToQueueButton.tsx";
import { SongContextMenu } from "@/features/songs/components/SongContextMenu.tsx";
import { memo } from "react";

interface SongContainerProps {
    node: SongQueueNode;
    buttonSize?: number;
    buttonClass?: string;
    titleMaxWidth?: string;
    renderItems?: Partial<RenderItems>;
}

interface RenderItems {
    image: boolean;
    addToQueueButton: boolean;
    addToLikedButton: boolean;
    playButton: boolean;
    removeFromPlaylistCtxBtn: boolean;
}

export const SongQueueContainer = memo(function SongContainer({
    node,
    buttonSize = 40,
    buttonClass = "p-2",
    titleMaxWidth = "max-w",
    renderItems = {},
}: SongContainerProps) {
    const {
        image = true,
        addToQueueButton = true,
        addToLikedButton = true,
        playButton = true,
        removeFromPlaylistCtxBtn = false,
    } = renderItems;

    const song = node.collection_song.song;
    const authors = song.authors.map((a) => a.display_name).join(", ");

    // TODO: consolidate with song container!
    return (
        <SongContextMenu
            song={node.collection_song}
            renderRemoveFromPlaylist={removeFromPlaylistCtxBtn}
        >
            <div className="flex h-full w-full items-center justify-between overflow-hidden">
                <div className="flex min-w-0 items-center gap-3">
                    {image &&
                        (song.image ? (
                            <img
                                src={song.image}
                                alt=""
                                className="h-10 w-10 rounded-sm border border-black object-cover"
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-black bg-gray-200">
                                <span className="text-xl text-gray-400">♪</span>
                            </div>
                        ))}

                    <div className="flex min-w-0 flex-col">
                        <p className={`truncate text-sm font-bold text-black ${titleMaxWidth}`}>
                            {song.title}
                        </p>
                        <p className={`truncate text-xs text-gray-600 ${titleMaxWidth}`}>
                            {authors}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {playButton && (
                        <SongQueuePlayButton
                            node={node}
                            size={buttonSize}
                            className={buttonClass}
                        />
                    )}
                    {addToLikedButton && (
                        <SongAddToLikedButton
                            collectionSong={node.collection_song}
                            size={buttonSize}
                            className={buttonClass}
                        />
                    )}
                    {addToQueueButton && (
                        <SongAddToQueueButton
                            collectionSong={node.collection_song}
                            size={buttonSize}
                            className={buttonClass}
                        />
                    )}
                </div>
            </div>
        </SongContextMenu>
    );
});
