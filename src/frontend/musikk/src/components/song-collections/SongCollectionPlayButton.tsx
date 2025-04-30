import { ISongCollectionDetailed } from "@/components/song-collections/types";
import { Button } from "@/components/ui/button";
import { PlaybackContext } from "@/providers/playbackContext";
import { PlayingCollectionContext } from "@/providers/playingCollectionContext";
import { Pause, Play } from "lucide-react";
import { useContext } from "react";

interface SongCollectionPlayButtonProps {
    collection: ISongCollectionDetailed;
    showComments: boolean;
}

export function SongCollectionPlayButton({ collection, showComments }: SongCollectionPlayButtonProps) {
    const { isPlaying } = useContext(PlaybackContext);
    const { handleCollectionPlayClick, playingCollection } = useContext(PlayingCollectionContext);
    const isThisPlaying = isPlaying && collection.uuid === playingCollection?.uuid;

    const renderPlayPauseIcon = () => {
        if (!playingCollection) return <Play size={20} />;
        return isThisPlaying ? <Pause size={20} /> : <Play size={20} />;
    };
    return (
        <Button
            className={`bg-red-600 hover:bg-red-700 text-white border-2
             border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              p-0 flex items-center justify-center ${showComments ? "h-8 w-8" : "h-12 w-12"}`}
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
