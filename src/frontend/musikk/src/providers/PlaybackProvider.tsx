import { useCollectionPlayback } from "@/hooks/useCollectionPlayback.ts";
import { usePlaybackState } from "@/hooks/usePlaybackState";
import { useSongPlayback } from "@/hooks/useSongPlayback.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { PlayingCollectionContext } from "@/providers/playingCollectionContext.ts";
import { PlayingSongContext } from "@/providers/playingSongContext.ts";
import { ReactNode } from "react";

interface PlaybackProviderProps {
    children: ReactNode;
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
    const { isPlaying, setIsPlaying } = usePlaybackState();
    const { playingSong, setPlayingSong, handleSongPlayClick } = useSongPlayback({ isPlaying, setIsPlaying });
    const { playingCollection, setPlayingCollection, handleCollectionPlayClick } = useCollectionPlayback({
        isPlaying,
        setIsPlaying,
    });

    return (
        <PlaybackContext.Provider value={{ isPlaying, setIsPlaying }}>
            <PlayingCollectionContext.Provider
                value={{ playingCollection, setPlayingCollection, handleCollectionPlayClick }}
            >
                <PlayingSongContext.Provider
                    value={{
                        playingSong,
                        setPlayingSong,
                        handleSongPlayClick,
                    }}
                >
                    {children}
                </PlayingSongContext.Provider>
            </PlayingCollectionContext.Provider>
        </PlaybackContext.Provider>
    );
}
