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
            variant="brand"
            size="icon"
            onClick={() => handlePlay()}
            className="p-0 flex items-center justify-center rounded-sm"
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
