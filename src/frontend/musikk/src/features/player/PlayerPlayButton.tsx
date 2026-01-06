import { useHandlePlay } from "@/features/playback/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { Button } from "@/features/ui/button.tsx";
import { Pause, Play } from "lucide-react";
import { useContext } from "react";

export function PlayerPlayButton() {
    const { isPlaybackActive } = useContext(PlaybackContext);
    const handlePlay = useHandlePlay();

    const renderPlayPauseIcon = () => {
        return isPlaybackActive ? <Pause size={18} /> : <Play size={18} />;
    };

    return (
        <Button
            variant="brand"
            size="icon"
            onClick={() => handlePlay()}
            className="flex items-center justify-center rounded-sm p-0"
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
