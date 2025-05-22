import { useCurrentDevice } from "@/hooks/useCurrentDevice.ts";
import { useQueue } from "@/components/song-queue/hooks/useQueueAPI.ts";
import { usePlaybackRetrieveQuery } from "@/playback/queries.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { ReactNode, useMemo } from "react";

interface PlaybackProviderProps {
    children: ReactNode;
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
    const { data: playback } = usePlaybackRetrieveQuery();
    const { data: queue } = useQueue();
    const { getDeviceID } = useCurrentDevice();
    const deviceID = getDeviceID();
    const head = queue?.nodes?.length && queue?.nodes?.length > 0 ? queue.nodes[0] : undefined;
    const isThisDeviceActive = useMemo(() => {
        return !!deviceID && !!playback?.active_device?.uuid && deviceID == playback?.active_device?.uuid;
    }, [playback, deviceID, playback?.active_device]);

    return (
        <PlaybackContext.Provider
            value={{
                playbackState: playback,
                playingCollectionSong: head?.collection_song,
                queueHead: head,
                isThisDeviceActive,
            }}
        >
            {children}
        </PlaybackContext.Provider>
    );
}
