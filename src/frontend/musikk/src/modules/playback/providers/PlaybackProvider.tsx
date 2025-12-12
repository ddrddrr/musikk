import { useCurrentDevice } from "@/modules/playback/hooks/useCurrentDevice.ts";
import { useDeviceList } from "@/modules/playback/hooks/useDeviceList.ts";
import { usePlaybackState } from "@/modules/playback/hooks/usePlaybackState.ts";
import { PlaybackContext } from "@/modules/playback/providers/playbackContext.ts";
import { useQueue } from "@/modules/song-queue/hooks/useQueueAPI.ts";
import { ReactNode } from "react";

interface PlaybackProviderProps {
    children: ReactNode;
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
    const { data: queue } = useQueue();
    const { getDeviceID, getDeviceName } = useCurrentDevice();
    const { activeDevice } = useDeviceList();
    const { isPlaying } = usePlaybackState();
    const queueHead = queue?.nodes?.length && queue?.nodes?.length > 0 ? queue.nodes[0] : undefined;
    const isThisDeviceActive = !!getDeviceID() && getDeviceID() === activeDevice?.id;
    // todo handle if device is not yet set(id/name params)
    return (
        <PlaybackContext.Provider
            value={{
                thisDevice: {
                    id: getDeviceID(),
                    name: getDeviceName(),
                },
                isThisDeviceActive: isThisDeviceActive,
                isPlaybackActive: isPlaying,
                playingCollectionSong: queueHead?.collection_song,
                queueHead,
            }}
        >
            {children}
        </PlaybackContext.Provider>
    );
}
