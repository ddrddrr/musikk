import {
    LoudnessPresetContext,
    type LoudnessPreset,
} from "@/features/player/providers/loudnessPresetContext.ts";
import { Song } from "@/features/songs/types.ts";
import { useCallback, useContext, useEffect, useRef } from "react";

const LOUDNESS_TARGETS: Record<LoudnessPreset, number> = {
    quiet: -19, // LUFS
    normal: -14,
    loud: -11,
};

const TRUE_PEAK_CEILING = -1; // dBTP

interface UseLoudnessNormalizationOptions {
    audioRef: React.RefObject<HTMLAudioElement>;
    song: Song | undefined;
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

// see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
// on how to use the audio API (very cool!)
export function useLoudnessNormalization({ audioRef, song }: UseLoudnessNormalizationOptions) {
    const { preset } = useContext(LoudnessPresetContext);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);

    const createAudioPipeline = useCallback(() => {
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
    }, [audioRef]);

    useEffect(() => {
        createAudioPipeline();

        // retry resume, since the pipeline may have been created before user interaction
        if (audioContextRef.current?.state === "suspended") {
            void audioContextRef.current.resume();
        }

        const gainNode = gainNodeRef.current;
        const compressorNode = compressorNodeRef.current;
        if (!gainNode || !compressorNode) return;

        if (song?.loudness_lufs == null) {
            gainNode.gain.value = 1;
            compressorNode.threshold.value = 0;
            compressorNode.ratio.value = 1;
            return;
        }

        const gainDb = computeGainDb(song, LOUDNESS_TARGETS[preset]);
        // audio api's gain is linear, so we convert from dB
        gainNode.gain.value = Math.pow(10, gainDb / 20);
        applyCompressor(compressorNode, preset);
    }, [song?.uuid, song?.loudness_lufs, song?.true_peak_dbtp, preset, createAudioPipeline]);

    useEffect(() => {
        return () => {
            audioContextRef.current?.close();
            // clear refs so the pipeline can be recreated on remount (mostly dev issue)
            audioContextRef.current = null;
            sourceNodeRef.current = null;
            gainNodeRef.current = null;
            compressorNodeRef.current = null;
        };
    }, []);
}
