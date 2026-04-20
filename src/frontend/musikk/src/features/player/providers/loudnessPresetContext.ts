import { createContext } from "react";

export type LoudnessPreset = "quiet" | "normal" | "loud";

export interface LoudnessPresetContextProps {
    preset: LoudnessPreset;
    setPreset: (preset: LoudnessPreset) => void;
}

export const LoudnessPresetContext = createContext<LoudnessPresetContextProps>({
    preset: "normal",
    setPreset: () => {},
});
