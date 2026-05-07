import { Dispatch, SetStateAction, useMemo, useState } from "react";

interface UseTotalDurationOptions {
    isThisDeviceActive: boolean;
    songDurationMs: number | null | undefined;
}

interface UseTotalDurationReturn {
    totalDuration: number;
    setAudioElemDurationSec: Dispatch<SetStateAction<number>>;
}

// active device gets duration from the audio elem (set on loadedmetadata)
// inactive devices fall back to song metadata (as no actual song is loaded)
export function useTotalDuration({
    isThisDeviceActive,
    songDurationMs,
}: UseTotalDurationOptions): UseTotalDurationReturn {
    const [audioElemDurationSec, setAudioElemDurationSec] = useState(0);

    const totalDuration = useMemo(() => {
        if (isThisDeviceActive) return audioElemDurationSec;
        return songDurationMs ? songDurationMs / 1000 : 0;
    }, [isThisDeviceActive, audioElemDurationSec, songDurationMs]);

    return { totalDuration, setAudioElemDurationSec };
}
