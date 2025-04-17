import { useState } from "react";

export function usePlaybackState() {
    const [isPlaying, setIsPlaying] = useState(false);

    return {
        isPlaying,
        setIsPlaying,
    };
}
