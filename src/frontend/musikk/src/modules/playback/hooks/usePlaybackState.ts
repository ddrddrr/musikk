import { PlaybackContext } from "@/modules/playback/providers/playbackContext.ts";
import { useContext } from "react";

export function usePlaybackState() {
    const { isPlaybackActive, setIsPlaybackActive } = useContext(PlaybackContext);

    return {
        isPlaying: isPlaybackActive,
        setIsPlaying: setIsPlaybackActive,
    };
}
