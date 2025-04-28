import { ISongCollectionDetailed } from "@/components/song-collections/types";
import { Button } from "@/components/ui/button";
import { PlaybackContext } from "@/providers/playbackContext";
import { PlayingCollectionContext } from "@/providers/playingCollectionContext";
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
        <Button
            className="bg-red-600 hover:bg-red-700 text-white h-full w-full"
            onClick={() => {
                if (handleCollectionPlayClick) {
                    handleCollectionPlayClick(collection);
                }
            }}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
