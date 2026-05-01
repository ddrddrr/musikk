import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import {
    LoudnessPresetContext,
    type LoudnessPreset,
} from "@/features/player/providers/loudnessPresetContext.ts";
import { Song } from "@/features/songs/types.ts";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

const LOUDNESS_TARGETS: Record<Exclude<LoudnessPreset, "off">, number> = {
    quiet: -19, // LUFS
    normal: -14,
    loud: -11,
};

const TRUE_PEAK_CEILING = -1; // dBTP

interface UseLoudnessNormalizationOptions {
    audioRef: React.RefObject<HTMLAudioElement>;
    song: Song | undefined;
}

interface UseLoudnessNormalizationReturn {
    ensureAudioPipeline: () => void;
}

// boosting a quiet track can push its peaks above 0 dBFS (clipping),
// so we cap gainDb at the headroom we have left before TRUE_PEAK_CEILING
function computeGainDb(song: Song, targetLufs: number): number {
    let gainDb = targetLufs - song.loudness_lufs;
    if (song.true_peak_dbtp != null) {
        const maxGain = TRUE_PEAK_CEILING - song.true_peak_dbtp;
        gainDb = Math.min(gainDb, maxGain);
    }
    return gainDb;
}

// the "loud" preset uses the compressor as a limiter so we can push gain higher without clipping
function applyCompressor(compressorNode: DynamicsCompressorNode, preset: LoudnessPreset) {
    if (preset === "loud") {
        compressorNode.threshold.value = TRUE_PEAK_CEILING;
        compressorNode.knee.value = 0;
        compressorNode.ratio.value = 20;
        compressorNode.attack.value = 0.005; // 5ms
        compressorNode.release.value = 0.1; // 100ms
    } else {
        compressorNode.threshold.value = 0;
        compressorNode.ratio.value = 1;
    }
}

// see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API
// on how to use the audio API (very cool!)
export function useLoudnessNormalization({
    audioRef,
    song,
}: UseLoudnessNormalizationOptions): UseLoudnessNormalizationReturn {
    const { isThisDeviceActive } = useContext(PlaybackContext);
    const { preset } = useContext(LoudnessPresetContext);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
    // drives a re-render after the gesture-bound build, so the settings effect re-fires
    // and replaces the browser-default DynamicsCompressor with the configured values
    const [hasPipeline, setHasPipeline] = useState(false);

    const ensureAudioPipeline = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || sourceNodeRef.current) return;

        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        // browsers start AudioContext suspended, so if we dont resume, the audio will be muted
        void ctx.resume();

        const sourceNode = ctx.createMediaElementSource(audio);
        sourceNodeRef.current = sourceNode;

        const gainNode = ctx.createGain();
        gainNodeRef.current = gainNode;

        const compressorNode = ctx.createDynamicsCompressor();
        compressorNodeRef.current = compressorNode;

        sourceNode.connect(gainNode);
        gainNode.connect(compressorNode);
        compressorNode.connect(ctx.destination);

        setHasPipeline(true);
    }, [audioRef]);

    // browsers gate AudioContext creation/resume on a user gesture; we capture the user's first
    // interaction anywhere on the page and build the pipeline synchronously inside it
    useEffect(() => {
        const initOnFirstGesture = () => {
            ensureAudioPipeline();
            document.removeEventListener("pointerdown", initOnFirstGesture, true);
            document.removeEventListener("keydown", initOnFirstGesture, true);
        };
        // capture phase so this runs before app handlers, while transient activation is fresh
        document.addEventListener("pointerdown", initOnFirstGesture, true);
        document.addEventListener("keydown", initOnFirstGesture, true);
        return () => {
            document.removeEventListener("pointerdown", initOnFirstGesture, true);
            document.removeEventListener("keydown", initOnFirstGesture, true);
        };
    }, [ensureAudioPipeline]);

    useEffect(() => {
        if (!isThisDeviceActive) return;

        const gainNode = gainNodeRef.current;
        const compressorNode = compressorNodeRef.current;
        if (!gainNode || !compressorNode) return;

        if (audioContextRef.current?.state === "suspended") {
            void audioContextRef.current.resume();
        }

        if (preset === "off" || song?.loudness_lufs == null) {
            gainNode.gain.value = 1;
            compressorNode.threshold.value = 0;
            compressorNode.ratio.value = 1;
            return;
        }

        const gainDb = computeGainDb(song, LOUDNESS_TARGETS[preset]);
        // audio api's gain is linear, so we convert from dB
        gainNode.gain.value = Math.pow(10, gainDb / 20);
        applyCompressor(compressorNode, preset);
    }, [
        song?.uuid,
        song?.loudness_lufs,
        song?.true_peak_dbtp,
        preset,
        isThisDeviceActive,
        hasPipeline,
    ]);

    useEffect(() => {
        return () => {
            // close the orphaned context to avoid leaks across StrictMode/HMR remounts
            void audioContextRef.current?.close();
            audioContextRef.current = null;
            sourceNodeRef.current = null;
            gainNodeRef.current = null;
            compressorNodeRef.current = null;
        };
    }, []);

    return { ensureAudioPipeline };
}
