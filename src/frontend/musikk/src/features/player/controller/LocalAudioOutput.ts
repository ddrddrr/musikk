import { isWebKit } from "@/features/player/browserEngine.ts";
import { AudioGraph } from "@/features/player/controller/AudioGraph.ts";
import { Song } from "@/features/songs/types.ts";
import { createStaleAsyncOpGuard } from "@/lib/staleAsyncOpGuard.ts";
import shaka from "shaka-player";
import { toast } from "sonner";

// the min interval that would trigger the audio elem seek
const SEEK_CHANGE_MIN_MS = 250;

const LOUDNESS_TARGET = -14; // LUFS
const TRUE_PEAK_CEILING = -1; // dBTP

export type SongLoudness = Pick<Song, "loudness_lufs" | "true_peak_dbtp">;

export interface AudioOutputHandlers {
    onMutedFallbackChange: (isMuted: boolean) => void;
}

export interface AudioPlayState {
    positionMs: number;
    isPlaying: boolean;
}

interface AttachedAudio {
    audio: HTMLAudioElement;
    player: shaka.Player;
    handlers: AudioOutputHandlers;
}

interface SourceChange {
    opId: number;
    attached: AttachedAudio;
}

// boosting a quiet track can push its loudness above 0 dBFS (clip),
// so we restrict gain at the headroom before TRUE_PEAK_CEILING
// without a recorded peak we cannot tell how much we can boost, so only turn down
function computeGainDb({ loudness_lufs, true_peak_dbtp }: SongLoudness): number {
    if (loudness_lufs == null) return 0;
    const gainDb = LOUDNESS_TARGET - loudness_lufs;
    if (true_peak_dbtp == null) return Math.min(gainDb, 0);
    return Math.min(gainDb, TRUE_PEAK_CEILING - true_peak_dbtp);
}

function dbToGain(gainDb: number): number {
    return 10 ** (gainDb / 20);
}

// we capture the user's first interaction and only then build the audio graph
// the graph is also built on a tab that does not play, so that
// audio can start without another gesture when this tab becomes the active device
// e.g., if the active device made another device active and then pressed play
function listenForFirstGesture(onGesture: () => void): () => void {
    const handler = () => {
        stopListening();
        onGesture();
    };
    const stopListening = () => {
        document.removeEventListener("pointerdown", handler, true);
        document.removeEventListener("keydown", handler, true);
    };
    document.addEventListener("pointerdown", handler, true);
    document.addEventListener("keydown", handler, true);
    return stopListening;
}

function waitForEvent(target: EventTarget, type: string): Promise<void> {
    return new Promise((resolve) => {
        target.addEventListener(type, () => resolve(), { once: true });
    });
}

// plays songs through Shaka and the audio element.
// It knows nothing about modes, WS messages or the playback state
export class LocalAudioOutput {
    private attached: AttachedAudio | null = null;
    private graph: AudioGraph | null = null;
    private stopListeningForGesture: (() => void) | null = null;
    private isAudioReady = false;
    private hasAudioLoadFailed = false;
    private userVolume = 1;
    private songLoudness: SongLoudness | null = null;
    private isNormalizationEnabled = true;

    private loadGuard = createStaleAsyncOpGuard();
    // play, pause and seek use the same fade gain, so the newest one is always applied
    // (and an older one stops after its wait)
    private fadeGuard = createStaleAsyncOpGuard();

    get isReady(): boolean {
        return this.isAudioReady;
    }

    get hasLoadFailed(): boolean {
        return this.hasAudioLoadFailed;
    }

    setUpPlayerForAudioElement(audio: HTMLAudioElement, handlers: AudioOutputHandlers): void {
        shaka.polyfill.installAll();
        if (!shaka.Player.isBrowserSupported()) {
            toast.error("Your browser is not supported for audio playback.");
            return;
        }
        const player = new shaka.Player();
        player.addEventListener("error", (event: Event) => {
            // TODO: log the user out when a segment request gets a 401 because the session expired.
            const detail = (event as CustomEvent<{ message?: string }>).detail;
            toast.error(detail?.message ?? "An audio streaming error occurred.");
        });
        this.attached = { audio, player, handlers };
        // the audio graph does not work in Safari https://bugs.webkit.org/show_bug.cgi?id=180696,
        // https://github.com/shaka-project/shaka-player/issues/3616,
        // and once a graph exists, Safari also ignores audio.volume https://bugs.webkit.org/show_bug.cgi?id=244667
        // so Safari gets only the volume controls, with no normalization and no fades
        if (!isWebKit) {
            this.graph = AudioGraph.existsForElement(audio);
            if (!this.graph) {
                this.stopListeningForGesture = listenForFirstGesture(() => this.buildGraph(audio));
            }
        }
        this.applyLevel();
    }

    tearDownPlayer(): void {
        this.stopListeningForGesture?.();
        this.stopListeningForGesture = null;
        this.loadGuard.markRunningOpStale();
        this.fadeGuard.markRunningOpStale();
        if (this.attached) void this.attached.player.destroy();
        this.attached = null;
        this.graph = null;
        this.isAudioReady = false;
        this.hasAudioLoadFailed = false;
    }

    // load == fetch the manifest from be and create smth like a pipe that sends audio segments
    // into the audio element.
    // getStartPoint is read only after the song loaded, because a command can change the wanted
    // position or play state while the song loads.
    // Resolves to true when the load finished and no newer load or unload replaced it.
    // It resolves only after the play attempt, since before it the audio is still paused,
    // and a failed play fires no event
    async load(
        url: string,
        loudness: SongLoudness,
        getStartPoint: () => AudioPlayState | null,
    ): Promise<boolean> {
        const change = await this.stopForSourceChange();
        if (!change) return false;
        const { opId, attached } = change;
        // only now, because the old song must not change its loudness while it fades out
        this.songLoudness = loudness;
        this.applyLevel();
        try {
            await attached.player.attach(attached.audio);
            if (this.loadGuard.isOpStale(opId)) return false;
            await attached.player.load(url);
            if (this.loadGuard.isOpStale(opId)) return false;
            this.isAudioReady = true;

            const startPoint = getStartPoint();
            if (!startPoint) return true;
            this.seekToStartPoint(attached.audio, startPoint.positionMs);
            if (startPoint.isPlaying) {
                await this.tryPlay(attached);
                if (this.loadGuard.isOpStale(opId)) return false;
            }
            return true;
        } catch {
            if (this.loadGuard.isOpStale(opId)) return false;
            this.hasAudioLoadFailed = true;
            toast.error("Failed to load audio. Please try again.");
            return false;
        }
    }

    // unload == remove the pipe (so no audio can come to the audio element)
    async unload(): Promise<void> {
        const change = await this.stopForSourceChange();
        if (!change) return;
        const { opId, attached } = change;
        try {
            await attached.player.unload();
        } catch {
            // unload can fail when the player is already being destroyed by tearDownPlayer()
            // so we just swallow the err and go along our day
        }
        if (this.loadGuard.isOpStale(opId)) return;
        attached.audio.pause();
        attached.audio.currentTime = 0;
        // a tab with nothing loaded has nothing to unmute
        attached.audio.muted = false;
        attached.handlers.onMutedFallbackChange(false);
    }

    play(): void {
        const attached = this.attached;
        if (!attached) return;
        // e.g. a pause is still fading out. play() would cut the sound for a moment.
        // A seek can also still be waiting for its sound, so this fade in waits for sound too
        if (!attached.audio.paused) {
            void this.fadeInAfterSoundPlays(this.fadeGuard.beginOp());
            return;
        }
        void this.tryPlay(attached);
    }

    pause(): void {
        const attached = this.attached;
        if (!attached) return;
        const pauseOpId = this.fadeGuard.beginOp();
        void (async () => {
            await this.graph?.fadeOut();
            if (this.fadeGuard.isOpStale(pauseOpId)) return;
            attached.audio.pause();
        })();
    }

    seek(targetMs: number): void {
        const attached = this.attached;
        if (!attached || !this.isAudioReady) return;
        const { audio } = attached;
        if (Math.abs(targetMs - audio.currentTime * 1000) <= SEEK_CHANGE_MIN_MS) return;

        const seekOpId = this.fadeGuard.beginOp();
        void (async () => {
            await this.graph?.fadeOut();
            if (this.fadeGuard.isOpStale(seekOpId)) return;
            const seeked = waitForEvent(audio, "seeked");
            audio.currentTime = targetMs / 1000;
            // a paused element stays silent, and the next play fades it in
            if (audio.paused) return;
            await seeked;
            if (this.fadeGuard.isOpStale(seekOpId)) return;
            await this.fadeInAfterSoundPlays(seekOpId);
        })();
    }

    unmute(): void {
        const attached = this.attached;
        if (!attached) return;
        this.graph?.silence();
        attached.audio.muted = false;
        this.graph?.fadeIn();
        attached.handlers.onMutedFallbackChange(false);
    }

    setUserVolume(value: number): void {
        this.userVolume = Math.max(0, Math.min(1, value));
        this.applyLevel();
    }

    setLoudnessNormalization(isEnabled: boolean): void {
        this.isNormalizationEnabled = isEnabled;
        this.applyLevel();
    }

    markEnded(): void {
        this.isAudioReady = false;
    }

    // a load pauses the element, and the element fires pause right before ended.
    // Neither of them is a real pause
    readReportableState(): AudioPlayState | null {
        const attached = this.attached;
        if (!attached || !this.isAudioReady || attached.audio.ended) return null;
        return {
            positionMs: attached.audio.currentTime * 1000,
            isPlaying: !attached.audio.paused,
        };
    }

    // the shared start of load and unload: fades out and pauses the element.
    // Returns null when a newer load or unload started during the fade
    private async stopForSourceChange(): Promise<SourceChange | null> {
        const attached = this.attached;
        if (!attached) return null;
        const opId = this.loadGuard.beginOp();
        // a pause or seek that still waits for its fade must not touch the element anymore
        this.fadeGuard.markRunningOpStale();
        this.isAudioReady = false;
        this.hasAudioLoadFailed = false;

        await this.graph?.fadeOut();
        if (this.loadGuard.isOpStale(opId)) return null;
        attached.audio.pause();
        return { opId, attached };
    }

    // the graph starts at the element's volume, because audio.volume becomes 1 at the same moment.
    // Otherwise a song that already plays would jump to full volume. Then the level moves smoothly
    // to include the normalization
    private buildGraph(audio: HTMLAudioElement): void {
        this.graph = AudioGraph.createForElement(audio, this.volumeGain());
        audio.volume = 1;
        this.applyLevel();
    }

    // without an audio graph (safari, or before the first gesture) the element sets the volume,
    // and there is no normalization
    private applyLevel(): void {
        if (this.graph) {
            this.graph.setLevel(this.volumeGain() * dbToGain(this.normalizationGainDb()));
        } else if (this.attached) {
            this.attached.audio.volume = this.volumeGain();
        }
    }

    private normalizationGainDb(): number {
        if (!this.isNormalizationEnabled || !this.songLoudness) return 0;
        return computeGainDb(this.songLoudness);
    }

    // squared, since this better approximates the real way we percieve loudness
    private volumeGain(): number {
        return this.userVolume ** 2;
    }

    private seekToStartPoint(audio: HTMLAudioElement, positionMs: number): void {
        const resumeAt = positionMs / 1000;
        if (resumeAt <= 0) return;
        if (audio.duration && resumeAt >= audio.duration) return;
        audio.currentTime = resumeAt;
    }

    private async fadeInAfterSoundPlays(fadeOpId: number): Promise<void> {
        const graph = this.graph;
        if (!graph) return;
        await graph.waitForActiveAudio();
        if (this.fadeGuard.isOpStale(fadeOpId)) return;
        graph.fadeIn();
    }

    private async tryPlay({ audio, handlers }: AttachedAudio): Promise<void> {
        const fadeOpId = this.fadeGuard.beginOp();
        try {
            this.graph?.silence();
            audio.muted = false;
            await audio.play();
            handlers.onMutedFallbackChange(false);
            void this.fadeInAfterSoundPlays(fadeOpId);
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            // if the user opens the app on a completely new device (non-active yet)
            // the new device becomes active and closes the active page
            // then, if the user re-opens the old window (which was active, but not anymore)
            // and resumes the playback, it should start on the new device
            // but if the user haven't interacted with the page on the new device,
            // autoplay will be blocked
            // muted playback is always allowed, so we fall back to it
            if (err instanceof DOMException && err.name === "NotAllowedError") {
                audio.muted = true;
                try {
                    await audio.play();
                    handlers.onMutedFallbackChange(true);
                    // dont fadeIn here since audio is muted, and unmute() does the fade
                    return;
                } catch {
                    audio.muted = false;
                    toast.error("Playback failed. Please try again.");
                    return;
                }
            }
            toast.error("Playback failed. Please try again.");
        }
    }
}
