import { ISongCollectionDetailed } from "@/components/song-collection/types.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { PlayingCollectionContext } from "@/providers/playingCollectionContext.ts";
import { Pause, Play } from "lucide-react";
import { useContext } from "react";

interface SongCollectionPlayButtonProps {
    collection: ISongCollectionDetailed;
}

export function SongCollectionPlayButton({ collection }: SongCollectionPlayButtonProps) {
    const { isPlaying } = useContext(PlaybackContext);
    const { handleCollectionPlayClick, playingCollection } = useContext(PlayingCollectionContext);
    const isThisPlaying = isPlaying && collection.uuid === playingCollection?.uuid;

    const renderPlayPauseIcon = () => {
        if (!playingCollection) return <Play size={18} />;
        return isThisPlaying ? <Pause size={18} /> : <Play size={18} />;
    };
    return (
        <button
            className="bg-red-500 hover:bg-red-600   rounded-full"
            onClick={() => {
                if (handleCollectionPlayClick) {
                    handleCollectionPlayClick(collection);
                }
            }}
        >
            {renderPlayPauseIcon()}{" "}
        </button>
    );
}
