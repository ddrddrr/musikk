import { useHandlePlay } from "@/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { Pause, Play } from "lucide-react";
import { useContext } from "react";

export function PlayerPlayButton() {
    const { playbackState } = useContext(PlaybackContext);
    const isPlaying = playbackState?.is_playing;
    const handlePlay = useHandlePlay();

    const renderPlayPauseIcon = () => {
        return isPlaying ? <Pause size={18} /> : <Play size={18} />;
    };

    return (
        <button
            className="bg-red-600 hover:bg-red-700 text-white border-2 border-black p-2 rounded-full flex items-center justify-center"
            onClick={() => handlePlay()}
        >
            {renderPlayPauseIcon()}
        </button>
    );
}
