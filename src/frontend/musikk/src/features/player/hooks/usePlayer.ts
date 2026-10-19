import { PlayerControllerContext } from "@/features/playback/providers/playbackContext.ts";
import {
    useActiveDeviceReportAction,
    useSetPlaybackAction,
} from "@/features/playback/ws/actionHooks.ts";
import { useQueueNext } from "@/features/song-queue/api/mutations.ts";
import { useContext, useEffect, useState } from "react";

interface UsePlayerOptions {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    ensureAudioPipeline: () => void;
    fadeIn: (durationMs?: number) => void;
    fadeOut: (durationMs?: number) => Promise<void>;
}

interface UsePlayerReturn {
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
}: UsePlayerOptions): UsePlayerReturn {
    const controller = useContext(PlayerControllerContext);
    const sendActiveDeviceReport = useActiveDeviceReportAction();
    const sendSet = useSetPlaybackAction();
    const { mutate: nextMutate } = useQueueNext();
    const [isMutedFallback, setIsMutedFallback] = useState(false);

    useEffect(() => {
        controller.setHandlers({
            sendActiveDeviceReport,
            sendSet,
            onSongEnd: () => nextMutate(),
        });
    }, [controller, sendActiveDeviceReport, sendSet, nextMutate]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        controller.init(audio, { fadeIn, fadeOut, onMutedFallbackChange: setIsMutedFallback });
        return () => controller.destroy();
    }, [audioRef, controller, fadeIn, fadeOut]);

    return {
        handleOnEnded: () => controller.handleEnded(),
        handleAudioStateChange: () => controller.handleAudioStateChange(),
        isMutedFallback,
        unmute: () => controller.unmute(ensureAudioPipeline),
    };
}
