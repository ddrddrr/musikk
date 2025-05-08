import { PlaybackContext } from "@/playback/playbackContext.ts";
import { usePlaybackRetrieveQuery } from "@/playback/queries.ts";
import { ReactNode } from "react";

interface PlaybackProviderProps {
    children: ReactNode;
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
    const playbackRetrieveQuery = usePlaybackRetrieveQuery();

    return (
        <PlaybackContext.Provider value={{ playbackState: playbackRetrieveQuery.data }}>
            {children}
        </PlaybackContext.Provider>
    );
}
