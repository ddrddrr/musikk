import { useCurrentDevice } from "@/features/playback/hooks/useCurrentDevice.ts";
import { useDeviceList } from "@/features/playback/hooks/useDeviceList.ts";
import { useTotalDuration } from "@/features/playback/hooks/useTotalDuration.ts";
import {
    PlaybackContext,
    PlayerControllerContext,
} from "@/features/playback/providers/playbackContext.ts";
import { useSubscribePlaybackEvents } from "@/features/playback/ws/wsEvents.ts";
import { AudioPlayerController } from "@/features/player/AudioPlayerController.ts";
import { useQueue } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { ReactNode, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

interface PlaybackProviderProps {
    children: ReactNode;
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
    const { error: queueError, refetch: queueRefetch } = useQueue();
    const device = useCurrentDevice();
    const { activeDevice } = useDeviceList();
    const isThisDeviceActive = device.id === activeDevice?.id;

    const [controller] = useState(() => new AudioPlayerController());
    // we can't just pass controller.subscribe
    // because in JS when someone does func = classInstance.method; func()
    // func doesn't have a reference to "this"........
    // useCallback is needed because useSyncExternalStore re-subscribes
    // whenever the subscribe func identity changes, and a fresh arrow on every
    // render would make it tear down + re-create the sub each time
    const playbackState = useSyncExternalStore(
        useCallback((cb) => controller.subscribe(cb), [controller]),
        useCallback(() => controller.getPlaybackState(), [controller]),
    );

    useSubscribePlaybackEvents(controller);

    useEffect(() => {
        controller.setIsThisDeviceActive(isThisDeviceActive);
    }, [controller, isThisDeviceActive]);

    const { totalDuration, setAudioElemDurationSec } = useTotalDuration({
        isThisDeviceActive,
        songDurationMs: playbackState?.collectionSong.song.duration_ms,
    });

    const isPlaybackActive = playbackState?.isPlaying ?? false;
    const contextValue = useMemo(
        () => ({
            isThisDeviceActive,
            isPlaybackActive,
            playbackState,
            queueError: queueError ?? null,
            queueRefetch: () => void queueRefetch(),
            totalDuration,
            setAudioElemDurationSec,
        }),
        [
            isThisDeviceActive,
            isPlaybackActive,
            playbackState,
            queueError,
            queueRefetch,
            totalDuration,
            setAudioElemDurationSec,
        ],
    );

    return (
        <PlaybackContext value={contextValue}>
            <PlayerControllerContext value={controller}>{children}</PlayerControllerContext>
        </PlaybackContext>
    );
}
