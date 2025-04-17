import { PlaybackContext } from "@/providers/playbackContext.ts";
import { PlayingSongContext } from "@/providers/playingSongContext.ts";
import { Pause, Play } from "lucide-react";
import { useContext } from "react";

export function PlayerPlayButton() {
    const { isPlaying } = useContext(PlaybackContext);
    const { handleSongPlayClick, playingSong } = useContext(PlayingSongContext);

    const renderPlayPauseIcon = () => {
        if (!playingSong) return <Play size={18} />;
        return isPlaying ? <Pause size={18} /> : <Play size={18} />;
    };

    return (
        <button
            className="bg-red-600 hover:bg-red-700 text-white border-2 border-black p-2 rounded-full flex items-center justify-center"
            onClick={() => {
                if (playingSong && handleSongPlayClick) {
                    handleSongPlayClick(playingSong);
                }
            }}
        >
            {renderPlayPauseIcon()}
        </button>
    );
}
