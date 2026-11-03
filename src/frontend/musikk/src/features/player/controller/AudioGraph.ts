const FADE_MS = 125;
// after 7 time constants a fade is below -60 dB, where it cannot be heard
const FADE_TIME_CONSTANT = FADE_MS / 1000 / 7; // seconds
// a level change settles in about 50 ms
const LEVEL_TIME_CONSTANT = 0.02; // seconds

// the element sends exact zeros into the graph while it has no sound, so anything above is sound
const SOUND_THRESHOLD = 1e-5; // about -100 dBFS
const SOUND_POLL_MS = 5;
// a bit more than one poll interval, so that no samples are missed between two polls
const SOUND_WINDOW = 256; // samples
// a song can start in digital silence, and then the fade in has to start anyway
const SOUND_WAIT_LIMIT_MS = 300;

// createMediaElementSource works only once per element. After an HMR edit the player is
// set up again for the same element, so it has to get the graph that element already has
const graphsByElement = new WeakMap<HTMLAudioElement, AudioGraph>();

// Web Audio gains are linear
function dbToGain(gainDb: number): number {
    return 10 ** (gainDb / 20);
}

// see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API
// on how to use the audio API.
// audio element -> analyser -> loudness gain -> volume gain -> fade envelope -> speakers.
// The volume is a gain, because a sudden audio.volume change clicks in Firefox.
// The envelope fades the sound around play, pause, seek and song changes, because a sudden
// jump in the waveform clicks.
// Every gain change is one setTargetAtTime, which starts from the value the gain has on the audio
// thread. Cancelling a running ramp first puts its old value back for a moment
// (https://webaudio.github.io/web-audio-api/#dom-audioparam-cancelscheduledvalues), and in Chrome
// gain.value lags behind the audio thread. Both make a small step, and a pure tone clicks on it
export class AudioGraph {
    private readonly ctx: AudioContext;
    private readonly analyser: AnalyserNode;
    private readonly loudness: AudioParam;
    private readonly volume: AudioParam;
    private readonly envelope: AudioParam;
    // the context time from which the envelope is silent, Infinity while it is open
    private silentAt = Infinity;

    private constructor(audio: HTMLAudioElement, initialVolume: number) {
        this.ctx = new AudioContext();
        // a context can start suspended, and then the audio is muted
        void this.ctx.resume();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = SOUND_WINDOW;
        const loudnessGain = this.ctx.createGain();
        const volumeGain = this.ctx.createGain();
        const envelopeGain = this.ctx.createGain();
        this.ctx.createMediaElementSource(audio).connect(this.analyser);
        this.analyser.connect(loudnessGain);
        loudnessGain.connect(volumeGain);
        volumeGain.connect(envelopeGain);
        envelopeGain.connect(this.ctx.destination);
        volumeGain.gain.value = initialVolume;
        this.loudness = loudnessGain.gain;
        this.volume = volumeGain.gain;
        this.envelope = envelopeGain.gain;
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
        this.loudness.setTargetAtTime(dbToGain(gainDb), this.ctx.currentTime, LEVEL_TIME_CONSTANT);
    }

    setVolume(value: number): void {
        this.volume.setTargetAtTime(value, this.ctx.currentTime, LEVEL_TIME_CONSTANT);
    }

    fadeIn(): void {
        if (this.ctx.state === "suspended") void this.ctx.resume();
        this.envelope.setTargetAtTime(1, this.ctx.currentTime, FADE_TIME_CONSTANT);
        this.silentAt = Infinity;
    }

    // resolves when the sound is silent, so the caller can pause or seek without a click.
    // A fade out that already runs is not started again, so a second caller waits only for the rest
    async fadeOut(): Promise<void> {
        const now = this.ctx.currentTime;
        if (this.silentAt === Infinity) {
            this.envelope.setTargetAtTime(0, now, FADE_TIME_CONSTANT);
            this.silentAt = now + FADE_MS / 1000;
        }
        const remainingMs = (this.silentAt - now) * 1000;
        if (remainingMs <= 0) return;
        // the extra 5 ms cover timer jitter
        await new Promise((resolve) => setTimeout(resolve, remainingMs + 5));
    }

    // for an element that is paused or muted, where a fade has nothing to fade
    silence(): void {
        const now = this.ctx.currentTime;
        this.envelope.setValueAtTime(0, now);
        this.silentAt = now;
    }

    // play(), the playing event and seeked all come before the element sends sound into the graph
    // (https://bugs.webkit.org/show_bug.cgi?id=277265). A fade in that starts on them is partly done
    // when the sound arrives, so the sound starts with a step.
    // Chrome runs this timer only once per second in a hidden tab. There the fade in can start up to
    // a second late, which is silent and does not click
    waitForSound(): Promise<void> {
        const samples = new Float32Array(SOUND_WINDOW);
        const startedAt = performance.now();
        return new Promise((resolve) => {
            const timer = setInterval(() => {
                this.analyser.getFloatTimeDomainData(samples);
                const hasSound = samples.some((sample) => Math.abs(sample) > SOUND_THRESHOLD);
                if (!hasSound && performance.now() - startedAt < SOUND_WAIT_LIMIT_MS) return;
                clearInterval(timer);
                resolve();
            }, SOUND_POLL_MS);
        });
    }
}
