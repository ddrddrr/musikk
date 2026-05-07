import { calculatePlaybackStatePosMs } from "@/features/playback/playbackPosition.ts";
import {
    getServerClockEstimateMs,
    setGlobalServerClockOffset,
} from "@/features/playback/serverClock.ts";
import { LocalPlaybackState } from "@/features/playback/types.ts";
import {
    PlaybackSeekPayload,
    PlaybackSnapshotPayload,
    updatedLocalPlaybackWithServerSeek,
    updatedLocalPlaybackWithServerSnapshot,
} from "@/features/playback/ws/playbackPayload.ts";
import { getUrlForSong } from "@/features/player/getUrlForSong.ts";
import { createStaleAsyncOpGuard } from "@/lib/staleAsyncOpGuard.ts";
import shaka from "shaka-player";
import { toast } from "sonner";

// the min interval that would trigger the audio elem seek
const SEEK_CHANGE_MIN_MS = 250;
// the drift check in startSyncWithServerLoop is true only when the FE sees drift,
// but FE figures out drift using its own local guess of "what time is it on the server right now"
// if no ws events arrive for some time, that caclculation can become wrong,
// and the check could stop noticing the clock drift
// the heartbeat just says "every 20s, send BE the acutal audio position"
// (didn't work properly without on long sessions)
const SYNC_DRIFT_CHECK_INTERVAL_MS = 1000;
const SYNC_DRIFT_THRESHOLD_MS = 500;
const SYNC_HEARTBEAT_MS = 20000;

export type PlaybackHandlers = {
    fadeIn: (durationMs?: number) => void;
    fadeOut: (durationMs?: number) => Promise<void>;
    sendSync: (posMs: number, songUuid: string) => void;
    sendSeek: (positionMs: number, songUuid: string) => void;
    onMutedFallbackChange: (v: boolean) => void;
    onSongEnd: () => void;
};

// this used to be handled with hooks (e.g. usePlayer)
// but the WS handlers kept reading stale values
// and a ton of hacks were added in order for server <-> client sync to work properly
// this got really messy, so the logic was centralized into a class
// so that all of the audio-related ops live in the same place
// and always read the fresh values

// playbackState and isThisDeviceActive aren't a copy of react state
// the controller owns playbackState directly and react reads it later through
// useSyncExternalStore,
// react later tells the controller about changes, e.g.,
// new isThisDeviceActive val by calling setIsThisDeviceActive
export class AudioPlayerController {
    private player: shaka.Player | null = null;
    private audio: HTMLAudioElement | null = null;
    private isAudioReady = false;
    // gates the sync loop while seekAudioElement() fades out, so the
    // pre-seek audio.currentTime doesnt get sent back to the server
    private seekInProgress = false;

    private playbackState: LocalPlaybackState | null = null;
    private isThisDeviceActive = false;

    // pub-sub here is not the same as the ws client, since useSyncExternalStore
    // wants listeners with no args and reads the state itself,
    // so notify() just tells every listener "something changed"
    // instead of sending a payload (event) to listeners like WSClient does
    private listeners = new Set<() => void>();
    private playbackHandlers: PlaybackHandlers | null = null;

    private loadGuard = createStaleAsyncOpGuard();
    private playOrPauseGuard = createStaleAsyncOpGuard();
    private seekGuard = createStaleAsyncOpGuard();
    private syncIntervalId: number | null = null;

    setHandlers(handlers: PlaybackHandlers): void {
        this.playbackHandlers = handlers;
    }

    init(audio: HTMLAudioElement): void {
        this.audio = audio;
        this.initShakaPlayer();
        // catch up to whatever WS events arrived before the audio element was mounted
        this.loadOrUnload();
        this.playOrPause();
        this.syncWithServer();
    }

    private initShakaPlayer(): void {
        shaka.polyfill.installAll();
        if (!shaka.Player.isBrowserSupported()) {
            toast.error("Your browser is not supported for audio playback.");
            return;
        }
        const player = new shaka.Player();
        this.player = player;
        player.addEventListener("error", (event: Event) => {
            const detail = (event as CustomEvent<{ message?: string }>).detail;
            toast.error(detail?.message ?? "An audio streaming error occurred.");
        });
    }

    destroy(): void {
        this.loadGuard.markRunningOpStale();
        this.playOrPauseGuard.markRunningOpStale();
        this.seekGuard.markRunningOpStale();
        if (this.syncIntervalId !== null) {
            window.clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
        }
        if (this.player) {
            void this.player.destroy();
            this.player = null;
        }
        this.audio = null;
        this.isAudioReady = false;
        this.seekInProgress = false;
    }

    getPlaybackState(): LocalPlaybackState | null {
        return this.playbackState;
    }

    // useSyncExternalStore calls this
    // the listener is react's "schedule a re-render" callback
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    // tells every listener (i.e., only react for us) that the state changed,
    // react will then call getPlaybackState() to read the new value (re-render)
    private notify(): void {
        this.listeners.forEach((cb) => cb());
    }

    applyServerSnapshot(payload: PlaybackSnapshotPayload): void {
        if (payload.server_ts_ms !== undefined) setGlobalServerClockOffset(payload.server_ts_ms);
        const prev = this.playbackState;
        const next = updatedLocalPlaybackWithServerSnapshot(prev, payload);
        // returning the prev ref when nothing changed lets useSyncExternalStore
        // not re-render (it compares values using ===)
        if (next === prev) return;
        this.playbackState = next;
        this.notify();

        const songChanged =
            (prev?.collectionSong.uuid ?? null) !== (next?.collectionSong.uuid ?? null);
        const playingChanged = (prev?.isPlaying ?? false) !== (next?.isPlaying ?? false);
        if (songChanged) {
            this.loadOrUnload();
            this.playOrPause();
        } else if (playingChanged) {
            this.playOrPause();
        }
        this.syncWithServer();
    }

    applyServerSeek(payload: PlaybackSeekPayload): void {
        if (payload.server_ts_ms !== undefined) setGlobalServerClockOffset(payload.server_ts_ms);
        const prev = this.playbackState;
        const next = updatedLocalPlaybackWithServerSeek(prev, payload);
        if (next === prev) return;
        this.playbackState = next;
        this.notify();
        this.seekAudioElement();
    }

    applyUserSeek(positionMs: number): void {
        const prev = this.playbackState;
        if (!prev) return;
        this.playbackState = {
            ...prev,
            positionMs,
            serverTsMs: getServerClockEstimateMs(),
        };
        this.notify();
        this.seekAudioElement();
        // we do the ! assertions everywhere because the controller is created before
        // the handlers and we can't realistically pass them in the constructor
        this.playbackHandlers!.sendSeek(positionMs, prev.collectionSong.uuid);
    }

    setIsThisDeviceActive(active: boolean): void {
        if (this.isThisDeviceActive === active) return;
        this.isThisDeviceActive = active;
        this.loadOrUnload();
        this.playOrPause();
        this.syncWithServer();
    }

    handleEnded(): void {
        this.isAudioReady = false;
        this.playbackHandlers!.onSongEnd();
    }

    async unmute(ensureAudioPipeline: () => void): Promise<void> {
        const audio = this.audio;
        if (!audio) return;
        // unmute click is the user gesture that lets us go over the autoplay policy
        // and build the AudioContext
        ensureAudioPipeline();
        await this.playbackHandlers!.fadeOut(0);
        audio.muted = false;
        this.playbackHandlers!.fadeIn();
        this.playbackHandlers!.onMutedFallbackChange(false);
    }

    // fades out and either attaches+loads the audio
    // (if the device is active and a song is set)
    // or unloads
    // load == fetch the manifest from be and create smth like a pipe that sends audio segments
    // into the audio element
    // unload == remove the pipe (so no audio can come to the audio element)
    private loadOrUnload(): void {
        if (!this.audio) return;
        const url = this.playbackState
            ? getUrlForSong(this.playbackState.collectionSong)
            : undefined;

        const loadOpId = this.loadGuard.beginOp();
        void (async () => {
            this.isAudioReady = false;
            const { player, audio } = this;
            if (!player || !audio) return;

            await this.playbackHandlers!.fadeOut();
            if (this.loadGuard.isOpStale(loadOpId)) return;
            audio.pause();

            if (url && this.isThisDeviceActive) {
                await this.loadSong(url, loadOpId);
            } else {
                await this.unloadSong(loadOpId);
            }
        })();
    }

    private playOrPause(): void {
        const audio = this.audio;
        if (!audio || !this.isAudioReady || !this.playbackState) return;

        const playOrPauseOpId = this.playOrPauseGuard.beginOp();
        void (async () => {
            if (this.isThisDeviceActive && this.playbackState?.isPlaying) {
                void this.tryPlay();
            } else {
                await this.playbackHandlers!.fadeOut();
                if (this.playOrPauseGuard.isOpStale(playOrPauseOpId)) return;
                audio.pause();
            }
        })();
    }

    private seekAudioElement(): void {
        const audio = this.audio;
        if (!audio || !this.isAudioReady) return;
        // on non-active devices there is no audio elem to seek
        if (!this.isThisDeviceActive) return;
        if (!this.playbackState) return;

        const targetMs = calculatePlaybackStatePosMs(this.playbackState);
        if (Math.abs(targetMs - audio.currentTime * 1000) <= SEEK_CHANGE_MIN_MS) return;

        const seekOpId = this.seekGuard.beginOp();
        this.seekInProgress = true;
        void (async () => {
            try {
                await this.playbackHandlers!.fadeOut();
                if (this.seekGuard.isOpStale(seekOpId)) return;
                audio.currentTime = targetMs / 1000;
                this.playbackHandlers!.fadeIn();
            } finally {
                // only clear if still the live op, because a newer seek may already set the flag
                // i.e., there will be a new seek operation and seekInProgress should stay true
                if (!this.seekGuard.isOpStale(seekOpId)) this.seekInProgress = false;
            }
        })();
    }

    // runs only on active device (and only when the playback is active)
    // sends the current audio state (pos/song) to the server in an interval
    private syncWithServer(): void {
        const shouldRun =
            this.isThisDeviceActive &&
            this.playbackState?.isPlaying === true &&
            this.audio !== null;
        if (shouldRun && this.syncIntervalId === null) {
            this.startSyncWithServerLoop();
        } else if (!shouldRun && this.syncIntervalId !== null) {
            window.clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
        }
    }

    private startSyncWithServerLoop(): void {
        let lastSyncAtMs = 0;
        this.syncIntervalId = window.setInterval(() => {
            const audio = this.audio;
            if (!audio || !this.isAudioReady) return;
            // seekAudioElement() sets seekInProgress but only writes
            // audio.currentTime after fadeOut finishes
            // during that time the audio elem still holds the pre-seek position,
            // so if we send a sync action it would send the old
            // position to the server and "undo" the seek
            if (this.seekInProgress) return;
            const playbackState = this.playbackState;
            if (!playbackState) return;

            const audioMs = audio.currentTime * 1000;
            const drift = Math.abs(audioMs - calculatePlaybackStatePosMs(playbackState));
            if (drift > SYNC_DRIFT_THRESHOLD_MS || Date.now() - lastSyncAtMs >= SYNC_HEARTBEAT_MS) {
                this.playbackHandlers!.sendSync(
                    Math.round(audioMs),
                    playbackState.collectionSong.uuid,
                );
                lastSyncAtMs = Date.now();
            }
        }, SYNC_DRIFT_CHECK_INTERVAL_MS);
    }

    private async tryPlay(): Promise<void> {
        const audio = this.audio;
        if (!audio) return;
        try {
            await this.playbackHandlers!.fadeOut(0);
            await audio.play();
            this.playbackHandlers!.onMutedFallbackChange(false);
            this.playbackHandlers!.fadeIn();
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
                    this.playbackHandlers!.onMutedFallbackChange(true);
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

    private async loadSong(url: string, loadOpId: number): Promise<void> {
        const { player, audio } = this;
        if (!player || !audio) return;
        try {
            await player.attach(audio);
            if (this.loadGuard.isOpStale(loadOpId)) return;
            await player.load(url);
            if (this.loadGuard.isOpStale(loadOpId)) return;
            this.isAudioReady = true;

            this.seekToServerPositionOnLoad();

            // BE always sets playback=false on any active-device transition,
            // so isPlaying=true here means the user explicitly hit play
            if (this.playbackState?.isPlaying && this.isThisDeviceActive) {
                void this.tryPlay();
            }
        } catch {
            if (this.loadGuard.isOpStale(loadOpId)) return;
            toast.error("Failed to load audio. Please try again.");
        }
    }

    private seekToServerPositionOnLoad(): void {
        const audio = this.audio;
        if (!audio) return;
        const playbackState = this.playbackState;
        if (!playbackState) return;

        const resumeAt = calculatePlaybackStatePosMs(playbackState) / 1000;
        if (resumeAt <= 0) return;
        if (audio.duration && resumeAt >= audio.duration) return;
        audio.currentTime = resumeAt;
    }

    private async unloadSong(loadOpId: number): Promise<void> {
        const { player, audio } = this;
        if (!player) return;
        try {
            await player.unload();
        } catch {
            // unload can fail when the player is already being destroyed by destroy()
            // so we just swallow the err and go along our day
        }
        if (this.loadGuard.isOpStale(loadOpId)) return;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
}
