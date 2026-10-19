import {
    PlaybackContext,
    PlayerControllerContext,
} from "@/features/playback/providers/playbackContext.ts";
import { THIS_DEVICE } from "@/features/playback/thisDevice.ts";
import { useSubscribePlaybackEvents } from "@/features/playback/ws/wsEvents.ts";
import { AudioPlayerController } from "@/features/player/controller/AudioPlayerController.ts";
import { useQueue } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { ReactNode, useCallback, useMemo, useState, useSyncExternalStore } from "react";

interface PlaybackProviderProps {
    children: ReactNode;
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
    const { error: queueError, refetch: queueRefetch } = useQueue();

    const [controller] = useState(() => new AudioPlayerController(THIS_DEVICE.id));
    // we can't just pass controller.subscribe
    // because in JS when someone does func = classInstance.method; func()
    // func doesn't have a reference to "this"........
    // useCallback is needed because useSyncExternalStore re-subscribes
    // whenever the subscribe func identity changes, and a fresh arrow on every
    // render would make it tear down + re-create the sub each time
    const subscribe = useCallback((cb: () => void) => controller.subscribe(cb), [controller]);
    const playbackState = useSyncExternalStore(
        subscribe,
        useCallback(() => controller.getPlaybackState(), [controller]),
    );
    const isThisDeviceActive = useSyncExternalStore(
        subscribe,
        useCallback(() => controller.getIsThisDeviceActive(), [controller]),
    );

    useSubscribePlaybackEvents(controller);

    const isPlaybackActive = playbackState?.isPlaying ?? false;
    const contextValue = useMemo(
        () => ({
            isThisDeviceActive,
            isPlaybackActive,
            playbackState,
            queueError: queueError ?? null,
            queueRefetch: () => void queueRefetch(),
        }),
        [isThisDeviceActive, isPlaybackActive, playbackState, queueError, queueRefetch],
    );

    return (
        <PlaybackContext value={contextValue}>
            <PlayerControllerContext value={controller}>{children}</PlayerControllerContext>
        </PlaybackContext>
    );
}
