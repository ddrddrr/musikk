import { useQueue } from "@/hooks/useQueueAPI.ts";
import { usePlaybackRetrieveQuery } from "@/playback/queries.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { ReactNode } from "react";

interface PlaybackProviderProps {
    children: ReactNode;
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
    const { data: playback } = usePlaybackRetrieveQuery();
    const { data: queue } = useQueue();

    const head = queue?.nodes?.length > 0 ? queue.nodes[0].collection_song : undefined;

    return (
        <PlaybackContext.Provider
            value={{
                playbackState: playback,
                playingCollectionSong: head,
            }}
        >
            {children}
        </PlaybackContext.Provider>
    );
}
