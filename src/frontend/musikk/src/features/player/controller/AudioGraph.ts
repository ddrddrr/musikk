// the browser does not fade linearly, instead every FADE_GAIN_STEP_MS,
// the volume changes a 1/3 (a fade out goes 1, 1/3, 1/9, 1/27, ...).
// so the volume never becomes exactly 0 or 1, and the browser never says that the fade is done
// but, e.g., fadeOut() has to know when it can pause without a click, so we pick that moment ourselves
// LEVEL_GAIN_STEP_MS is the same kind of step for volume and loudness changes
const FADE_DURATION_MS = 125;
const FADE_GAIN_STEP_MS = FADE_DURATION_MS / 7;
const LEVEL_GAIN_STEP_MS = 20;
const AUDIO_ACTIVE_CHECK_INTERVAL_MS = 5;
const AUDIO_ACTIVE_CHECK_WINDOW_SAMPLES = 256;
const AUDIO_ACTIVE_CHECK_THRESHOLD = 1e-5; // about -100 dBFS, we don't consider anything lower as a sound
const AUDIO_ACTIVE_CHECK_TIMEOUT_MS = 300;

// WeakMap, so this can be GC'd after, e.g., React's hot reload (the audio element will be removed in that case)
const graphsByElement = new WeakMap<HTMLAudioElement, AudioGraph>();

// see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API
// roughly we use it like this: audio element -> analyser -> level gain -> fade envelope -> speakers
// the level is the user volume times the loudness normalization
// fades/envelops are mostly needed to eliminate audible "clicks" on seek, volume change and other operations
export class AudioGraph {
    private readonly ctx: AudioContext;
    private readonly analyser: AnalyserNode;
    private readonly level: AudioParam;
    private readonly envelope: AudioParam;
    // the context time from which the envelope is silent, Infinity while it is open
    private silentAt = Infinity;

    private constructor(audio: HTMLAudioElement, initialLevel: number) {
        this.ctx = new AudioContext();
        // a context can start suspended, and then the audio is muted
        void this.ctx.resume();

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = AUDIO_ACTIVE_CHECK_WINDOW_SAMPLES;

        const levelGain = this.ctx.createGain();
        const envelopeGain = this.ctx.createGain();
        this.ctx.createMediaElementSource(audio).connect(this.analyser);
        this.analyser.connect(levelGain);
        levelGain.connect(envelopeGain);
        envelopeGain.connect(this.ctx.destination);
        levelGain.gain.value = initialLevel;

        this.level = levelGain.gain;
        this.envelope = envelopeGain.gain;
    }

    // must be called inside a user gesture, because browsers allow an AudioContext only after one
    static createForElement(audio: HTMLAudioElement, initialLevel: number): AudioGraph {
        let graph = graphsByElement.get(audio);
        if (!graph) {
            graph = new AudioGraph(audio, initialLevel);
            graphsByElement.set(audio, graph);
        }
        return graph;
    }

    static existsForElement(audio: HTMLAudioElement): AudioGraph | null {
        return graphsByElement.get(audio) ?? null;
    }

    setLevel(gain: number): void {
        this.level.setTargetAtTime(gain, this.ctx.currentTime, LEVEL_GAIN_STEP_MS / 1000);
    }

    fadeIn(): void {
        if (this.ctx.state === "suspended") void this.ctx.resume();
        this.envelope.setTargetAtTime(1, this.ctx.currentTime, FADE_GAIN_STEP_MS / 1000);
        this.silentAt = Infinity;
    }

    // resolves when the sound is silent, so the caller can pause or seek without a click.
    // A fade out that already runs is not started again, so a second caller waits only for the rest
    async fadeOut(): Promise<void> {
        const now = this.ctx.currentTime;
        if (this.silentAt === Infinity) {
            this.envelope.setTargetAtTime(0, now, FADE_GAIN_STEP_MS / 1000);
            this.silentAt = now + FADE_DURATION_MS / 1000;
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

    // play(), the play event and seek event come before the sound is actually playing
    // https://bugs.webkit.org/show_bug.cgi?id=277265
    // so if we start the fade in right when they arrive it can end before the sound actually plays
    waitForActiveAudio(): Promise<void> {
        const samples = new Float32Array(AUDIO_ACTIVE_CHECK_WINDOW_SAMPLES);
        const startedAt = performance.now();
        return new Promise((resolve) => {
            const timer = setInterval(() => {
                this.analyser.getFloatTimeDomainData(samples);
                const isActive = samples.some(
                    (sample) => Math.abs(sample) > AUDIO_ACTIVE_CHECK_THRESHOLD,
                );
                const hasTimedOut = performance.now() - startedAt >= AUDIO_ACTIVE_CHECK_TIMEOUT_MS;
                if (!isActive && !hasTimedOut) return;
                clearInterval(timer);
                resolve();
            }, AUDIO_ACTIVE_CHECK_INTERVAL_MS);
        });
    }
}
