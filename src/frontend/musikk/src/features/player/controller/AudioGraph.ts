const FADE_MS = 125;
const LOUDNESS_RAMP_TIME_CONSTANT = 0.05; // seconds
// below this the envelope cannot be heard, so a fade out has nothing to wait for
const SILENT_GAIN = 0.001;

// createMediaElementSource works only once per element. After an HMR edit the player is
// set up again for the same element, so it has to get the graph that element already has
const graphsByElement = new WeakMap<HTMLAudioElement, AudioGraph>();

// Web Audio gains are linear
function dbToGain(gainDb: number): number {
    return 10 ** (gainDb / 20);
}

// a new ramp can come while the last one still runs, and without cancellation the scheduled
// events would override each other. The new ramp then starts from the value heard right now
function holdCurrentValue(param: AudioParam, now: number): void {
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
}

// see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API
// on how to use the audio API.
// audio element -> loudness gain -> fade envelope -> speakers.
// The envelope fades the sound around play, pause, seek and song changes, because a sudden
// jump in the waveform clicks
export class AudioGraph {
    private readonly ctx: AudioContext;
    private readonly loudnessGain: GainNode;
    private readonly envelope: GainNode;

    private constructor(audio: HTMLAudioElement) {
        this.ctx = new AudioContext();
        // a context can start suspended, and then the audio is muted
        void this.ctx.resume();
        this.loudnessGain = this.ctx.createGain();
        this.envelope = this.ctx.createGain();
        this.ctx.createMediaElementSource(audio).connect(this.loudnessGain);
        this.loudnessGain.connect(this.envelope);
        this.envelope.connect(this.ctx.destination);
    }

    // must be called inside a user gesture, because browsers allow an AudioContext only after one
    static forElement(audio: HTMLAudioElement): AudioGraph {
        let graph = graphsByElement.get(audio);
        if (!graph) {
            graph = new AudioGraph(audio);
            graphsByElement.set(audio, graph);
        }
        return graph;
    }

    // ramped, because the setting can change while a song plays.
    // See https://developer.mozilla.org/en-US/docs/Web/API/GainNode for why ramps are needed
    setLoudness(gainDb: number): void {
        const now = this.ctx.currentTime;
        holdCurrentValue(this.loudnessGain.gain, now);
        this.loudnessGain.gain.setTargetAtTime(dbToGain(gainDb), now, LOUDNESS_RAMP_TIME_CONSTANT);
    }

    fadeIn(): void {
        if (this.ctx.state === "suspended") void this.ctx.resume();
        this.rampEnvelope(1);
    }

    // resolves when the sound is silent, so the caller can pause or seek without a click
    async fadeOut(): Promise<void> {
        const isSilent = this.envelope.gain.value < SILENT_GAIN;
        this.rampEnvelope(0);
        if (isSilent) return;
        // the extra 5 ms cover timer jitter
        await new Promise((resolve) => setTimeout(resolve, FADE_MS + 5));
    }

    // for an element that is paused or muted, where a fade has nothing to fade
    silence(): void {
        const now = this.ctx.currentTime;
        this.envelope.gain.cancelScheduledValues(now);
        this.envelope.gain.setValueAtTime(0, now);
    }

    // linear, because unlike the loudness, a fade has a known end time
    private rampEnvelope(target: 0 | 1): void {
        const now = this.ctx.currentTime;
        holdCurrentValue(this.envelope.gain, now);
        this.envelope.gain.linearRampToValueAtTime(target, now + FADE_MS / 1000);
    }
}
