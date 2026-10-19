import {
    isLoudnessPreset,
    LoudnessPresetContext,
    type LoudnessPreset,
} from "@/features/player/providers/loudnessPresetContext.ts";
import { ReactNode, useCallback, useMemo, useState } from "react";

const LOUDNESS_PRESET_KEY = "loudnessPreset";
const DEFAULT_LOUDNESS_PRESET: LoudnessPreset = "normal";

function readLoudnessPreset(): LoudnessPreset {
    const saved = localStorage.getItem(LOUDNESS_PRESET_KEY);
    return isLoudnessPreset(saved) ? saved : DEFAULT_LOUDNESS_PRESET;
}

interface LoudnessPresetProviderProps {
    children: ReactNode;
}

export function LoudnessPresetProvider({ children }: LoudnessPresetProviderProps) {
    const [preset, setPresetState] = useState<LoudnessPreset>(readLoudnessPreset);

    const setPreset = useCallback((p: LoudnessPreset) => {
        localStorage.setItem(LOUDNESS_PRESET_KEY, p);
        setPresetState(p);
    }, []);

    const value = useMemo(() => ({ preset, setPreset }), [preset, setPreset]);

    return <LoudnessPresetContext value={value}>{children}</LoudnessPresetContext>;
}
