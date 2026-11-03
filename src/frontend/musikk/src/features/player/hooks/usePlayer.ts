import { usePlayerController } from "@/features/playback/hooks/usePlayerController.ts";
import {
    useActiveDeviceReportAction,
    useSetPlaybackAction,
} from "@/features/playback/ws/actionHooks.ts";
import { useLoudnessNormalization } from "@/features/player/hooks/useLoudnessNormalization.ts";
import { useQueueNext } from "@/features/song-queue/api/mutations.ts";
import { useEffect, useState } from "react";

interface UsePlayerOptions {
    audioRef: React.RefObject<HTMLAudioElement | null>;
}

interface UsePlayerReturn {
    handleOnEnded: () => void;
    handleAudioStateChange: () => void;
    isMutedFallback: boolean;
    unmute: () => void;
}

export function usePlayer({ audioRef }: UsePlayerOptions): UsePlayerReturn {
    const controller = usePlayerController();
    const { isEnabled: isNormalizationEnabled } = useLoudnessNormalization();
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
        controller.setLoudnessNormalization(isNormalizationEnabled);
    }, [controller, isNormalizationEnabled]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        controller.init(audio, { onMutedFallbackChange: setIsMutedFallback });
        return () => controller.destroy();
    }, [audioRef, controller]);

    return {
        handleOnEnded: () => controller.handleEnded(),
        handleAudioStateChange: () => controller.handleAudioStateChange(),
        isMutedFallback,
        unmute: () => controller.unmute(),
    };
}
