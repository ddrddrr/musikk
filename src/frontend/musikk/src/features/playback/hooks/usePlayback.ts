import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { useContext } from "react";

export function usePlayback() {
    const context = useContext(PlaybackContext);
    if (!context) {
        throw new Error("usePlayback must be used within a PlaybackProvider");
    }
    return context;
}
