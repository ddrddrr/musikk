import { SongQueuePlayButtonButton } from "@/components/song-queue/SongQueueContainerPlayButton.tsx";
import { ISongQueueNode } from "@/components/song-queue/types.ts";
import { SongAddToLikedButton } from "@/components/songs/SongAddToLikedButton.tsx";
import { SongAddToQueueButton } from "@/components/songs/SongAddToQueueButton.tsx";
import { SongContextMenu } from "@/components/songs/SongContextMenu.tsx";
import { memo } from "react";

interface SongContainerProps {
    node: ISongQueueNode;
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

    return (
        <SongContextMenu song={node.collection_song} renderRemoveFromPlaylist={removeFromPlaylistCtxBtn}>
            <div className="flex items-center justify-between w-full h-full overflow-hidden">
                <div className="flex items-center gap-3 min-w-0">
                    {image &&
                        (song.image ? (
                            <img
                                src={song.image}
                                alt=""
                                className="w-10 h-10 object-cover rounded-sm border border-black"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-gray-200 flex items-center justify-center rounded-sm border border-black">
                                <span className="text-gray-400 text-xl">♪</span>
                            </div>
                        ))}

                    <div className="flex flex-col min-w-0">
                        <p className={`font-bold text-sm text-black truncate ${titleMaxWidth}`}>{song.title}</p>
                        <p className={`text-xs text-gray-600 truncate ${titleMaxWidth}`}>{authors}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {playButton && <SongQueuePlayButtonButton node={node} size={buttonSize} className={buttonClass} />}
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
