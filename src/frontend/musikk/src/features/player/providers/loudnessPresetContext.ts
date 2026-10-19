import { createContext } from "react";

export const LOUDNESS_PRESETS = ["off", "quiet", "normal", "loud"] as const;
export type LoudnessPreset = (typeof LOUDNESS_PRESETS)[number];

export function isLoudnessPreset(value: string | null): value is LoudnessPreset {
    return LOUDNESS_PRESETS.some((preset) => preset === value);
}

export interface LoudnessPresetContextProps {
    preset: LoudnessPreset;
    setPreset: (preset: LoudnessPreset) => void;
}

export const LoudnessPresetContext = createContext<LoudnessPresetContextProps | null>(null);
