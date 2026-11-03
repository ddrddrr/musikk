import { useSyncExternalStore } from "react";

const LOUDNESS_NORMALIZATION_KEY = "loudnessNormalization";

function readLoudnessNormalization(): boolean {
    return localStorage.getItem(LOUDNESS_NORMALIZATION_KEY) !== "false";
}

function writeLoudnessNormalization(isEnabled: boolean): void {
    localStorage.setItem(LOUDNESS_NORMALIZATION_KEY, String(isEnabled));
    // the browser fires "storage" only in the other tabs, so we notify this tab ourselves
    window.dispatchEvent(new StorageEvent("storage", { key: LOUDNESS_NORMALIZATION_KEY }));
}

// each tab is its own playback device, so a change made in one tab has to reach the tab that plays
function subscribeToStorage(onChange: () => void): () => void {
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
}

export function useLoudnessNormalization() {
    const isEnabled = useSyncExternalStore(subscribeToStorage, readLoudnessNormalization);
    return { isEnabled, setIsEnabled: writeLoudnessNormalization };
}
