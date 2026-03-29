import { useCurrentDevice } from "@/features/playback/hooks/useCurrentDevice.ts";
import { useDeviceList } from "@/features/playback/hooks/useDeviceList.ts";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { useQueue } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { ReactNode, useState } from "react";

interface PlaybackProviderProps {
    children: ReactNode;
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
    const { data: queue, error: queueError, refetch: queueRefetch } = useQueue();
    const { getDeviceID, getDeviceName } = useCurrentDevice();
    const { activeDevice } = useDeviceList();
    const [isPlaybackActive, setIsPlaybackActive] = useState(false);
    const queueHead = queue?.current_song ?? null;
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
                playingCollectionSong: queueHead ?? undefined,
                queueHead,
                queueError: queueError ?? null,
                queueRefetch: () => void queueRefetch(),
            }}
        >
            {children}
        </PlaybackContext.Provider>
    );
}
