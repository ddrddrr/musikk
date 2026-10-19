import { LoudnessPresetContext } from "@/features/player/providers/loudnessPresetContext.ts";
import { useContext } from "react";

export function useLoudnessPreset() {
    const context = useContext(LoudnessPresetContext);
    if (!context) {
        throw new Error("useLoudnessPreset must be used within a LoudnessPresetProvider");
    }
    return context;
}
