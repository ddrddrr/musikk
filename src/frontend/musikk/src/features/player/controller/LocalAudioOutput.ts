import { createStaleAsyncOpGuard } from "@/lib/staleAsyncOpGuard.ts";
import shaka from "shaka-player";
import { toast } from "sonner";

// the min interval that would trigger the audio elem seek
const SEEK_CHANGE_MIN_MS = 250;

export interface AudioOutputHandlers {
    fadeIn: (durationMs?: number) => void;
    fadeOut: (durationMs?: number) => Promise<void>;
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

// plays songs through Shaka and the audio element.
// It knows nothing about modes, WS messages or the playback state
export class LocalAudioOutput {
    private attached: AttachedAudio | null = null;
    private isAudioReady = false;
    private hasAudioLoadFailed = false;

    private loadGuard = createStaleAsyncOpGuard();
    private playOrPauseGuard = createStaleAsyncOpGuard();
    private seekGuard = createStaleAsyncOpGuard();

    get isAttached(): boolean {
        return this.attached !== null;
    }

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
            const detail = (event as CustomEvent<{ message?: string }>).detail;
            toast.error(detail?.message ?? "An audio streaming error occurred.");
        });
        this.attached = { audio, player, handlers };
    }

    tearDownPlayer(): void {
        this.loadGuard.markRunningOpStale();
        this.playOrPauseGuard.markRunningOpStale();
        this.seekGuard.markRunningOpStale();
        if (this.attached) void this.attached.player.destroy();
        this.attached = null;
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
    async load(url: string, getStartPoint: () => AudioPlayState | null): Promise<boolean> {
        const change = await this.stopForSourceChange();
        if (!change) return false;
        const { opId, attached } = change;
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
        this.playOrPauseGuard.beginOp();
        // e.g. a pause is still fading out. play() would cut the sound for a moment
        if (!attached.audio.paused) {
            attached.handlers.fadeIn();
            return;
        }
        void this.tryPlay(attached);
    }

    pause(): void {
        const attached = this.attached;
        if (!attached) return;
        const pauseOpId = this.playOrPauseGuard.beginOp();
        void (async () => {
            await attached.handlers.fadeOut();
            if (this.playOrPauseGuard.isOpStale(pauseOpId)) return;
            attached.audio.pause();
        })();
    }

    seek(targetMs: number): void {
        const attached = this.attached;
        if (!attached || !this.isAudioReady) return;
        const { audio, handlers } = attached;
        if (Math.abs(targetMs - audio.currentTime * 1000) <= SEEK_CHANGE_MIN_MS) return;

        const seekOpId = this.seekGuard.beginOp();
        void (async () => {
            await handlers.fadeOut();
            if (this.seekGuard.isOpStale(seekOpId)) return;
            audio.currentTime = targetMs / 1000;
            handlers.fadeIn();
        })();
    }

    async unmute(ensureAudioPipeline: () => void): Promise<void> {
        const attached = this.attached;
        if (!attached) return;
        // unmute click is the user gesture that lets us go over the autoplay policy
        // and build the AudioContext
        ensureAudioPipeline();
        await attached.handlers.fadeOut(0);
        attached.audio.muted = false;
        attached.handlers.fadeIn();
        attached.handlers.onMutedFallbackChange(false);
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
        this.isAudioReady = false;
        this.hasAudioLoadFailed = false;

        await attached.handlers.fadeOut();
        if (this.loadGuard.isOpStale(opId)) return null;
        attached.audio.pause();
        return { opId, attached };
    }

    private seekToStartPoint(audio: HTMLAudioElement, positionMs: number): void {
        const resumeAt = positionMs / 1000;
        if (resumeAt <= 0) return;
        if (audio.duration && resumeAt >= audio.duration) return;
        audio.currentTime = resumeAt;
    }

    private async tryPlay({ audio, handlers }: AttachedAudio): Promise<void> {
        try {
            await handlers.fadeOut(0);
            // the element can still be muted from an earlier fallback, and a muted play
            // always succeeds. The user may have clicked on the page since, so try with sound first
            audio.muted = false;
            await audio.play();
            handlers.onMutedFallbackChange(false);
            handlers.fadeIn();
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
                    // dont fadeIn here since audio is muted, and unmute() does the
                    // anti-pop fade for audio.muted=false
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
