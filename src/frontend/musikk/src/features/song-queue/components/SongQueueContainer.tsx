import { SongQueueNode } from "@/features/song-queue/api/types.ts";
import { SongQueuePlayButton } from "@/features/song-queue/components/SongQueueContainerPlayButton.tsx";
import { SongAddToLikedButton } from "@/features/songs/components/SongAddToLikedButton.tsx";
import { SongAddToQueueButton } from "@/features/songs/components/SongAddToQueueButton.tsx";
import { SongContextMenu } from "@/features/songs/components/SongContextMenu.tsx";

interface SongContainerProps {
    node: SongQueueNode;
}

export function SongQueueContainer({ node }: SongContainerProps) {
    const song = node.collection_song.song;
    const authors = song.authors.map((a) => a.display_name).join(", ");

    // TODO: consolidate with song container!
    return (
        <SongContextMenu song={node.collection_song}>
            <div className="flex h-full w-full items-center justify-between overflow-hidden">
                <div className="flex min-w-0 items-center gap-3">
                    {song.image ? (
                        <img
                            src={song.image}
                            alt=""
                            className="h-10 w-10 rounded-sm border border-black object-cover"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-black bg-gray-200">
                            <span className="text-xl text-gray-400">♪</span>
                        </div>
                    )}
                    <div className="flex min-w-0 flex-col">
                        <p className={`max-w truncate text-sm font-bold text-black`}>
                            {song.title}
                        </p>
                        <p className={`max-w truncate text-xs text-gray-600`}>{authors}</p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <SongQueuePlayButton node={node} size={40} className={"p-2"} />
                    <SongAddToLikedButton
                        collectionSong={node.collection_song}
                        size={40}
                        className={"p-2"}
                    />
                    <SongAddToQueueButton
                        collectionSong={node.collection_song}
                        size={40}
                        className={"p-2"}
                    />
                </div>
            </div>
        </SongContextMenu>
    );
}
