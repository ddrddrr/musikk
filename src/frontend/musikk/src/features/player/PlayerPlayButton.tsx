import { useHandlePlay } from "@/features/playback/hooks/useHandlePlay.ts";
import { usePlayback } from "@/features/playback/hooks/usePlayback.ts";
import { Button } from "@/features/ui/button.tsx";
import { Pause, Play } from "lucide-react";

export function PlayerPlayButton() {
    const { isPlaybackActive } = usePlayback();
    const handlePlay = useHandlePlay();

    const renderPlayPauseIcon = () => {
        return isPlaybackActive ? <Pause size={18} /> : <Play size={18} />;
    };

    return (
        <Button variant="brand" size="icon" onClick={() => handlePlay()} className="rounded-sm">
            {renderPlayPauseIcon()}
        </Button>
    );
}
