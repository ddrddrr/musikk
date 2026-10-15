import { PlayerControllerContext } from "@/features/playback/providers/playbackContext.ts";
import {
    useActiveDeviceReportAction,
    useSetPlaybackAction,
} from "@/features/playback/ws/actionHooks.ts";
import { useQueueNext } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { useContext, useEffect, useState } from "react";

interface UsePlayerOptions {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    ensureAudioPipeline: () => void;
    fadeIn: (durationMs?: number) => void;
    fadeOut: (durationMs?: number) => Promise<void>;
    onDurationChange?: (duration: number) => void;
}

interface UsePlayerReturn {
    handleLoadedMetadata: () => void;
    handleOnEnded: () => void;
    handleAudioStateChange: () => void;
    isMutedFallback: boolean;
    unmute: () => Promise<void>;
}

export function usePlayer({
    audioRef,
    ensureAudioPipeline,
    fadeIn,
    fadeOut,
    onDurationChange,
}: UsePlayerOptions): UsePlayerReturn {
    const controller = useContext(PlayerControllerContext);
    const sendActiveDeviceReport = useActiveDeviceReportAction();
    const sendSet = useSetPlaybackAction();
    const { mutate: nextMutate } = useQueueNext();
    const [isMutedFallback, setIsMutedFallback] = useState(false);

    useEffect(() => {
        controller.setHandlers({
            fadeIn,
            fadeOut,
            sendActiveDeviceReport,
            sendSet,
            onMutedFallbackChange: setIsMutedFallback,
            onSongEnd: () => nextMutate(),
        });
    }, [controller, fadeIn, fadeOut, sendActiveDeviceReport, sendSet, nextMutate]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        controller.init(audio);
        return () => controller.destroy();
    }, [audioRef, controller]);

    function handleLoadedMetadata() {
        const audio = audioRef.current;
        if (audio) {
            onDurationChange?.(audio.duration);
        }
    }

    return {
        handleLoadedMetadata,
        handleOnEnded: () => controller.handleEnded(),
        handleAudioStateChange: () => controller.handleAudioStateChange(),
        isMutedFallback,
        unmute: () => controller.unmute(ensureAudioPipeline),
    };
}
