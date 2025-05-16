import { Button } from "@/components/ui/button.tsx";
import { useHandlePlay } from "@/playback/hooks/useHandlePlay.ts";
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
        <Button
            className={`bg-red-600 hover:bg-red-700 text-white border-2 border-black flex items-center justify-center rounded-sm`}
            onClick={() => handlePlay()}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
