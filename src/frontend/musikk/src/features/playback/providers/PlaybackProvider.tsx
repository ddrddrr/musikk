import { useCurrentDevice } from "@/features/playback/hooks/useCurrentDevice.ts";
import { useDeviceList } from "@/features/playback/hooks/useDeviceList.ts";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { useQueue } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { ReactNode, useState } from "react";

interface PlaybackProviderProps {
    children: ReactNode;
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
    const { data: queue } = useQueue();
    const { getDeviceID, getDeviceName } = useCurrentDevice();
    const { activeDevice } = useDeviceList();
    const [isPlaybackActive, setIsPlaybackActive] = useState(false);
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
                isPlaybackActive,
                setIsPlaybackActive,
                playingCollectionSong: queueHead?.collection_song,
                queueHead,
            }}
        >
            {children}
        </PlaybackContext.Provider>
    );
}
