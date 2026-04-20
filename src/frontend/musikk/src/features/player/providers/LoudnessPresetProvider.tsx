import {
    LoudnessPresetContext,
    type LoudnessPreset,
} from "@/features/player/providers/loudnessPresetContext.ts";
import { ReactNode, useCallback, useMemo, useState } from "react";

interface LoudnessPresetProviderProps {
    children: ReactNode;
}

export function LoudnessPresetProvider({ children }: LoudnessPresetProviderProps) {
    const [preset, setPresetState] = useState<LoudnessPreset>(() => {
        const saved = localStorage.getItem("loudnessPreset");
        return (saved as LoudnessPreset) ?? "normal";
    });

    const setPreset = useCallback((p: LoudnessPreset) => {
        localStorage.setItem("loudnessPreset", p);
        setPresetState(p);
    }, []);

    const value = useMemo(() => ({ preset, setPreset }), [preset, setPreset]);

    return (
        <LoudnessPresetContext.Provider value={value}>
            {children}
        </LoudnessPresetContext.Provider>
    );
}
