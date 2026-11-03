import { usePlayback } from "@/features/playback/hooks/usePlayback.ts";
import { readDeviceVolume } from "@/features/player/deviceVolumeStorage.ts";
import { useLoudnessNormalization } from "@/features/player/hooks/useLoudnessNormalization.ts";
import { Song } from "@/features/songs/types.ts";
import { useCallback, useEffect, useRef, useState } from "react";

const LOUDNESS_TARGET = -14; // LUFS

const TRUE_PEAK_CEILING = -1; // dBTP

// see https://developer.mozilla.org/en-US/docs/Web/API/GainNode for why ramps are needed
const VOLUME_RAMP_TIME_CONSTANT = 0.05; // should be good enough...
const DEFAULT_FADE_MS = 125;

interface UseAudioPipelineOptions {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    song: Song | undefined;
}

interface UseAudioPipelineReturn {
    ensureAudioPipeline: () => void;
    setUserVolume: (value: number) => void;
    fadeIn: (durationMs?: number) => void;
    fadeOut: (durationMs?: number) => Promise<void>;
}

interface AudioPipeline {
    ctx: AudioContext;
    source: MediaElementAudioSourceNode;
    loudnessGain: GainNode;
    volumeGain: GainNode;
    gainEnvelope: GainNode;
}

// boosting a quiet track can push its peaks above 0 dBFS (clipping),
// so we cap gainDb at the headroom we have left before TRUE_PEAK_CEILING
function computeGainDb(song: Song): number {
    if (song.loudness_lufs == null) return 0;
    let gainDb = LOUDNESS_TARGET - song.loudness_lufs;
    if (song.true_peak_dbtp != null) {
        const maxGain = TRUE_PEAK_CEILING - song.true_peak_dbtp;
        gainDb = Math.min(gainDb, maxGain);
    }
    return gainDb;
}

function buildAudioPipeline(audio: HTMLAudioElement): AudioPipeline {
    const ctx = new AudioContext();
    // browsers start AudioContext suspended, so if we dont resume, the audio will be muted
    void ctx.resume();

    const source = ctx.createMediaElementSource(audio);
    const loudnessGain = ctx.createGain();

    const volumeGain = ctx.createGain();
    // get from localStorage so an unmute on first gesture doesn't briefly play at 100%
    const savedVolume = readDeviceVolume();
    if (savedVolume !== undefined) {
        volumeGain.gain.value = savedVolume / 100;
    }

    const gainEnvelope = ctx.createGain();

    source.connect(loudnessGain);
    loudnessGain.connect(volumeGain);
    volumeGain.connect(gainEnvelope);
    gainEnvelope.connect(ctx.destination);

    return { ctx, source, loudnessGain, volumeGain, gainEnvelope };
}

function rampGain(gainNode: GainNode, ctx: AudioContext, target: number) {
    const now = ctx.currentTime;
    // https://developer.mozilla.org/en-US/docs/Web/API/AudioParam
    // we need to remove scheduled events as when we move the volume slider there is a ton
    // of events scheduled every "slide tick" and without cancellation they would unexpectadly
    // override each other
    gainNode.gain.cancelScheduledValues(now);
    // then we set the curr value from which we are going to ramp
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    // we dont use linearRampToValueAtTime/exponentialRampToValueAtTime because
    // we don't know the "end time" of when the user will finish moving the slider
    gainNode.gain.setTargetAtTime(target, now, VOLUME_RAMP_TIME_CONSTANT);
}

function rampToUserVolume(volumeGain: GainNode, ctx: AudioContext, value: number) {
    rampGain(volumeGain, ctx, Math.max(0, Math.min(1, value)));
}

function rampGainEnvelope(
    gainEnvelope: GainNode,
    ctx: AudioContext,
    target: 0 | 1,
    durationMs: number,
) {
    const now = ctx.currentTime;
    gainEnvelope.gain.cancelScheduledValues(now);
    gainEnvelope.gain.setValueAtTime(gainEnvelope.gain.value, now);
    if (durationMs <= 0) {
        gainEnvelope.gain.setValueAtTime(target, now);
        return;
    }
    // and here we can use linearRampToValueAtTime since we control the fade duration
    // (i.e. we have a stop time)
    gainEnvelope.gain.linearRampToValueAtTime(target, now + durationMs / 1000);
}

function applyLoudnessSettings(
    pipeline: AudioPipeline,
    song: Song | undefined,
    isNormalizationEnabled: boolean,
) {
    if (pipeline.ctx.state === "suspended") {
        void pipeline.ctx.resume();
    }
    // ramp here, because the new song gain is in process while the old song still fades out,
    // without this it would click
    if (!isNormalizationEnabled || song?.loudness_lufs == null) {
        rampGain(pipeline.loudnessGain, pipeline.ctx, 1);
        return;
    }
    const gainDb = computeGainDb(song);
    // audio api's gain is linear, so we convert from dB
    // prolly factor out to a method
    rampGain(pipeline.loudnessGain, pipeline.ctx, Math.pow(10, gainDb / 20));
}

// browsers gate AudioContext creation/resume on a user gesture
// we capture the user's first interaction anywhere on the page
// and build the pipeline synchronously inside it
function listenForFirstGesture(initFn: () => void) {
    const handler = () => {
        initFn();
        document.removeEventListener("pointerdown", handler, true);
        document.removeEventListener("keydown", handler, true);
    };
    document.addEventListener("pointerdown", handler, true);
    document.addEventListener("keydown", handler, true);
    return () => {
        document.removeEventListener("pointerdown", handler, true);
        document.removeEventListener("keydown", handler, true);
    };
}

function disposePipeline(ref: React.RefObject<AudioPipeline | null>) {
    return () => {
        // close the orphaned context to avoid leaks across StrictMode/HMR remounts
        void ref.current?.ctx.close();
        ref.current = null;
    };
}

// see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API
// on how to use the audio API (very cool!)

// this won't work in Safari (on any platform)
// https://bugs.webkit.org/show_bug.cgi?id=180696
// https://github.com/shaka-project/shaka-player/issues/3616
export function useAudioPipeline({
    audioRef,
    song,
}: UseAudioPipelineOptions): UseAudioPipelineReturn {
    const { isThisDeviceActive } = usePlayback();
    const { isEnabled: isNormalizationEnabled } = useLoudnessNormalization();
    const pipelineRef = useRef<AudioPipeline | null>(null);
    // drives a re-render after the gesture-bound build, so the settings effect re-fires
    // and applies the current song's gain to the new graph
    const [hasPipeline, setHasPipeline] = useState(false);

    const ensureAudioPipeline = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || pipelineRef.current) return;
        pipelineRef.current = buildAudioPipeline(audio);
        setHasPipeline(true);
    }, [audioRef]);

    useEffect(() => listenForFirstGesture(ensureAudioPipeline), [ensureAudioPipeline]);

    useEffect(() => {
        if (!isThisDeviceActive || !pipelineRef.current) return;
        applyLoudnessSettings(pipelineRef.current, song, isNormalizationEnabled);
    }, [
        song?.uuid,
        song?.loudness_lufs,
        song?.true_peak_dbtp,
        isNormalizationEnabled,
        isThisDeviceActive,
        hasPipeline,
    ]);

    const setUserVolume = useCallback((value: number) => {
        const pipeline = pipelineRef.current;
        if (!pipeline) return;
        rampToUserVolume(pipeline.volumeGain, pipeline.ctx, value);
    }, []);

    const fadeIn = useCallback((durationMs: number = DEFAULT_FADE_MS) => {
        const pipeline = pipelineRef.current;
        if (!pipeline) return;
        rampGainEnvelope(pipeline.gainEnvelope, pipeline.ctx, 1, durationMs);
    }, []);

    const fadeOut = useCallback(async (durationMs: number = DEFAULT_FADE_MS) => {
        const pipeline = pipelineRef.current;
        if (!pipeline) return;
        // idempotent so awaiters don't stall on already-silent envelope
        if (pipeline.gainEnvelope.gain.value < 0.001) return;
        rampGainEnvelope(pipeline.gainEnvelope, pipeline.ctx, 0, durationMs);
        // resolve after the ramp has audibly completed (small slack for scheduling jitter)
        await new Promise((resolve) => setTimeout(resolve, durationMs + 5));
    }, []);

    useEffect(() => disposePipeline(pipelineRef), []);

    return { ensureAudioPipeline, setUserVolume, fadeIn, fadeOut };
}
