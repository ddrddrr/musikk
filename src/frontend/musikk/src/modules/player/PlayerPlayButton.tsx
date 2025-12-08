import { useHandlePlay } from "@/modules/playback/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/modules/playback/providers/playbackContext.ts";
import { Button } from "@/modules/ui/button.tsx";
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
            variant="brand"
            size="icon"
            onClick={() => handlePlay()}
            className="p-0 flex items-center justify-center rounded-sm"
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
