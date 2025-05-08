import { ISongCollectionDetailed } from "@/components/song-collections/types";
import { Button } from "@/components/ui/button";
import { useHandlePlay } from "@/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/providers/playbackContext";
import { Pause, Play } from "lucide-react";
import { useContext } from "react";

interface SongCollectionPlayButtonProps {
    collection: ISongCollectionDetailed;
    showComments: boolean;
}

export function SongCollectionPlayButton({ collection, showComments }: SongCollectionPlayButtonProps) {
    const { playbackState, playingCollectionSong } = useContext(PlaybackContext);
    const handlePlay = useHandlePlay();
    const isThisChosen = collection.uuid === playingCollectionSong?.song_collection;
    const isThisPlaying = playbackState?.is_playing && isThisChosen;

    const renderPlayPauseIcon = () => {
        return isThisPlaying ? <Pause size={20} /> : <Play size={20} />;
    };
    return (
        <Button
            className={`bg-red-600 hover:bg-red-700 text-white border-2
             border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              p-0 flex items-center justify-center ${showComments ? "h-8 w-8" : "h-12 w-12"}`}
            onClick={() => (isThisChosen ? handlePlay() : handlePlay({ newCollection: collection }))}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
