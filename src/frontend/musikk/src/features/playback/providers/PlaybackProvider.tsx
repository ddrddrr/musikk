import { useCurrentDevice } from "@/features/playback/hooks/useCurrentDevice.ts";
import { useDeviceList } from "@/features/playback/hooks/useDeviceList.ts";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { useQueue } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { ReactNode, useMemo, useState } from "react";

interface PlaybackProviderProps {
    children: ReactNode;
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
    const { data: queue, error: queueError, refetch: queueRefetch } = useQueue();
    const device = useCurrentDevice();
    const { activeDevice } = useDeviceList();
    // TODO: should not be device-specific but tracked on BE
    const [isPlaybackActive, setIsPlaybackActive] = useState(false);
    const playingCollectionSong = queue?.current_song ?? undefined;
    const isThisDeviceActive = !!device.id && device.id === activeDevice?.id;

    const value = useMemo(
        () => ({
            thisDevice: device,
            isThisDeviceActive,
            isPlaybackActive,
            setIsPlaybackActive,
            playingCollectionSong,
            queueError: queueError ?? null,
            queueRefetch: () => void queueRefetch(),
        }),
        [
            device,
            isThisDeviceActive,
            isPlaybackActive,
            playingCollectionSong,
            queueError,
            queueRefetch,
        ],
    );

    return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}
