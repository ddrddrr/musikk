const FADE_MS = 125;
const LEVEL_RAMP_MS = 50;
// below this the envelope cannot be heard, so a fade out has nothing to wait for
const SILENT_GAIN = 0.001;

// createMediaElementSource works only once per element. After an HMR edit the player is
// set up again for the same element, so it has to get the graph that element already has
const graphsByElement = new WeakMap<HTMLAudioElement, AudioGraph>();

// Web Audio gains are linear
function dbToGain(gainDb: number): number {
    return 10 ** (gainDb / 20);
}

interface ParamPoint {
    time: number;
    value: number;
}

// Firefox can read AudioParam.value as the last value set through the setter, not the value of
// a running ramp (https://bugzilla.mozilla.org/show_bug.cgi?id=1171438). A ramp that starts
// from that value jumps and clicks, so we work out the current value from our own last ramp
class RampedParam {
    private readonly param: AudioParam;
    private from: ParamPoint;
    private to: ParamPoint;

    constructor(param: AudioParam, initialValue: number) {
        this.param = param;
        param.value = initialValue;
        this.from = { time: 0, value: initialValue };
        this.to = this.from;
    }

    valueAt(time: number): number {
        const { from, to } = this;
        if (time >= to.time) return to.value;
        if (time <= from.time) return from.value;
        const progress = (time - from.time) / (to.time - from.time);
        return from.value + (to.value - from.value) * progress;
    }

    // a new ramp can come while the last one still runs, and without cancellation the scheduled
    // events would override each other. See https://developer.mozilla.org/en-US/docs/Web/API/GainNode
    // for why ramps are needed at all
    rampTo(value: number, now: number, durationMs: number): void {
        const current = this.valueAt(now);
        this.param.cancelScheduledValues(now);
        this.param.setValueAtTime(current, now);
        this.param.linearRampToValueAtTime(value, now + durationMs / 1000);
        this.from = { time: now, value: current };
        this.to = { time: now + durationMs / 1000, value };
    }

    jumpTo(value: number, now: number): void {
        this.param.cancelScheduledValues(now);
        this.param.setValueAtTime(value, now);
        this.from = { time: now, value };
        this.to = this.from;
    }
}

// see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API
// on how to use the audio API.
// audio element -> loudness gain -> volume gain -> fade envelope -> speakers.
// The volume is a ramped gain, because a sudden audio.volume change clicks in Firefox.
// The envelope fades the sound around play, pause, seek and song changes, because a sudden
// jump in the waveform clicks
export class AudioGraph {
    private readonly ctx: AudioContext;
    private readonly loudness: RampedParam;
    private readonly volume: RampedParam;
    private readonly envelope: RampedParam;

    private constructor(audio: HTMLAudioElement, initialVolume: number) {
        this.ctx = new AudioContext();
        // a context can start suspended, and then the audio is muted
        void this.ctx.resume();
        const loudnessGain = this.ctx.createGain();
        const volumeGain = this.ctx.createGain();
        const envelopeGain = this.ctx.createGain();
        this.ctx.createMediaElementSource(audio).connect(loudnessGain);
        loudnessGain.connect(volumeGain);
        volumeGain.connect(envelopeGain);
        envelopeGain.connect(this.ctx.destination);
        this.loudness = new RampedParam(loudnessGain.gain, 1);
        this.volume = new RampedParam(volumeGain.gain, initialVolume);
        this.envelope = new RampedParam(envelopeGain.gain, 1);
    }

    // must be called inside a user gesture, because browsers allow an AudioContext only after one
    static forElement(audio: HTMLAudioElement, initialVolume: number): AudioGraph {
        let graph = graphsByElement.get(audio);
        if (!graph) {
            graph = new AudioGraph(audio, initialVolume);
            graphsByElement.set(audio, graph);
        }
        return graph;
    }

    static existingFor(audio: HTMLAudioElement): AudioGraph | null {
        return graphsByElement.get(audio) ?? null;
    }

    setLoudness(gainDb: number): void {
        this.loudness.rampTo(dbToGain(gainDb), this.ctx.currentTime, LEVEL_RAMP_MS);
    }

    setVolume(value: number): void {
        this.volume.rampTo(value, this.ctx.currentTime, LEVEL_RAMP_MS);
    }

    fadeIn(): void {
        if (this.ctx.state === "suspended") void this.ctx.resume();
        this.envelope.rampTo(1, this.ctx.currentTime, FADE_MS);
    }

    // resolves when the sound is silent, so the caller can pause or seek without a click
    async fadeOut(): Promise<void> {
        const now = this.ctx.currentTime;
        const isSilent = this.envelope.valueAt(now) < SILENT_GAIN;
        this.envelope.rampTo(0, now, FADE_MS);
        if (isSilent) return;
        // the extra 5 ms cover timer jitter
        await new Promise((resolve) => setTimeout(resolve, FADE_MS + 5));
    }

    // for an element that is paused or muted, where a fade has nothing to fade
    silence(): void {
        this.envelope.jumpTo(0, this.ctx.currentTime);
    }
}
