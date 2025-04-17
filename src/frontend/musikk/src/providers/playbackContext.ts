import { createContext } from "react";

export interface PlaybackContextProps {
    isPlaying: boolean;
    setIsPlaying: (val: boolean) => void;
}

export const PlaybackContext = createContext<PlaybackContextProps>({
    isPlaying: false,
    setIsPlaying: () => {},
});
