import {
    calculatePlaybackStatePosMs,
    rebasePlaybackStateToNow,
} from "@/features/playback/playbackPosition.ts";
import {
    getServerClockEstimateMs,
    setGlobalServerClockOffset,
} from "@/features/playback/serverClock.ts";
import { LocalPlaybackState } from "@/features/playback/types.ts";
import {
    ActiveDeviceReportPayload,
    PlaybackSetPayload,
    PlaybackSnapshotPayload,
    updatedLocalPlaybackWithServerSnapshot,
} from "@/features/playback/ws/playbackPayload.ts";
import { getUrlForSong } from "@/features/player/getUrlForSong.ts";
import { createStaleAsyncOpGuard } from "@/lib/staleAsyncOpGuard.ts";
import shaka from "shaka-player";
import { toast } from "sonner";

// the min interval that would trigger the audio elem seek
const SEEK_CHANGE_MIN_MS = 250;
// other tabs move the position forward with the clock, but the real audio can fall behind,
// e.g. when the browser lags or the tab sleeps in the background,
// so the active tab sends its real position regularly while it plays
const REPORT_HEARTBEAT_MS = 10000;
const PENDING_TIMEOUT_MS = 5000;
const PENDING_SEEK_TOLERANCE_MS = 1000;

export type PlaybackHandlers = {
    fadeIn: (durationMs?: number) => void;
    fadeOut: (durationMs?: number) => Promise<void>;
    sendActiveDeviceReport: (payload: ActiveDeviceReportPayload) => void;
    sendSet: (payload: PlaybackSetPayload) => void;
    onMutedFallbackChange: (v: boolean) => void;
    onSongEnd: () => void;
};

interface PendingIsPlaying {
    isPlaying: boolean;
    timeoutId: number;
}

interface PendingSeek {
    targetMs: number;
    releasedAtServerMs: number;
    currPlayItemUniqueId: string;
    timeoutId: number;
}

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

// the active tab owns the play state and the position. It plays, pauses and seeks its audio
// directly and reports what the audio did. The other tabs send their requests through the server
export class AudioPlayerController {
    private player: shaka.Player | null = null;
    private audio: HTMLAudioElement | null = null;
    private isAudioReady = false;

    // the active tab writes it from the audio element, because only the audio knows the real state.
    // On the other tabs it is the last snapshot
    private playbackState: LocalPlaybackState | null = null;
    // the active tab switches to it when it stops being active
    private lastSnapshotState: LocalPlaybackState | null = null;
    // what react reads: playbackState plus the pending values of a non-active tab.
    // It is stored, so useSyncExternalStore gets the same object while nothing changed
    private viewState: LocalPlaybackState | null = null;
    private pendingIsPlaying: PendingIsPlaying | null = null;
    private pendingSeek: PendingSeek | null = null;
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
    private heartbeatIntervalId: number | null = null;

    setHandlers(handlers: PlaybackHandlers): void {
        this.playbackHandlers = handlers;
    }

    init(audio: HTMLAudioElement): void {
        this.audio = audio;
        this.initShakaPlayer();
        // catch up to whatever WS events arrived before the audio element was mounted
        this.loadOrUnload();
        this.playOrPause();
        this.updateHeartbeat();
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
        this.stopHeartbeat();
        this.clearPendingIsPlaying();
        this.clearPendingSeek();
        if (this.player) {
            void this.player.destroy();
            this.player = null;
        }
        this.audio = null;
        this.isAudioReady = false;
    }

    getPlaybackState(): LocalPlaybackState | null {
        return this.viewState;
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
        const next = updatedLocalPlaybackWithServerSnapshot(this.lastSnapshotState, payload);
        this.lastSnapshotState = next;

        const prev = this.playbackState;
        const playItemChanged = prev?.currPlayItemUniqueId !== next?.currPlayItemUniqueId;
        // any other snapshot is an echo of this tab's own report
        // or the paused state of a device switch away from this tab
        if (this.isThisDeviceActive && !playItemChanged) return;

        if (!this.isThisDeviceActive) this.dropSettledPending(next);
        this.setPlaybackState(next);
        if (playItemChanged) {
            this.loadOrUnload();
            this.playOrPause();
        }
    }

    // the role is not checked: the server sends playback.set only to the active device,
    // and react may tell the controller about a new role after the command arrives
    applyCommand(command: PlaybackSetPayload): void {
        const prev = this.playbackState;
        if (!prev) return;
        const seekMs =
            command.curr_play_item_unique_id === prev.currPlayItemUniqueId
                ? command.song_pos_ms
                : undefined;
        const isPlaying = command.is_playing;
        if (seekMs === undefined && isPlaying === undefined) return;

        if (!this.isAudioReady) {
            // loadSong starts from the stored values
            const wanted = rebasePlaybackStateToNow(prev);
            if (seekMs !== undefined) wanted.positionMs = seekMs;
            if (isPlaying !== undefined) wanted.isPlaying = isPlaying;
            this.setPlaybackState(wanted);
            return;
        }

        if (seekMs !== undefined) {
            this.setPlaybackState({
                ...prev,
                positionMs: seekMs,
                serverTsMs: getServerClockEstimateMs(),
            });
            this.seekAudioElement(seekMs);
        }
        if (isPlaying === true) this.playAudio();
        if (isPlaying === false) this.pauseAudio();
    }

    setIsPlaying(isPlaying: boolean): void {
        if (this.isThisDeviceActive) {
            this.applyCommand({ is_playing: isPlaying });
            return;
        }
        this.setPendingIsPlaying(isPlaying);
        // we do the ! assertions everywhere because the controller is created before
        // the handlers and we can't realistically pass them in the constructor
        this.playbackHandlers!.sendSet({ is_playing: isPlaying });
    }

    // sent through the server even on the active tab: the HTTP response can arrive before
    // the snapshot with the new song, but the server forwards the command after that snapshot
    playAfterSongChange(): void {
        if (!this.isThisDeviceActive) this.setPendingIsPlaying(true);
        this.playbackHandlers!.sendSet({ is_playing: true });
    }

    applyUserSeek(positionMs: number): void {
        const prev = this.playbackState;
        if (!prev) return;
        const command = {
            song_pos_ms: Math.round(positionMs),
            curr_play_item_unique_id: prev.currPlayItemUniqueId,
        };
        if (this.isThisDeviceActive) {
            this.applyCommand(command);
            return;
        }
        this.setPendingSeek(positionMs, prev.currPlayItemUniqueId);
        this.playbackHandlers!.sendSet(command);
    }

    setIsThisDeviceActive(active: boolean): void {
        if (this.isThisDeviceActive === active) return;
        this.isThisDeviceActive = active;
        if (active) {
            this.clearPendingIsPlaying();
            this.clearPendingSeek();
        } else {
            // the paused snapshot of a device switch arrives while this tab is still active
            this.playbackState = this.lastSnapshotState;
        }
        this.refreshView();
        this.loadOrUnload();
        this.playOrPause();
        this.updateHeartbeat();
    }

    handleAudioStateChange(): void {
        const audio = this.reportableAudio();
        const prev = this.playbackState;
        if (!audio || !prev) return;
        // this tab ignores its own echoes, so it has to write the real audio state itself
        this.setPlaybackState({
            ...prev,
            isPlaying: !audio.paused,
            positionMs: audio.currentTime * 1000,
            serverTsMs: getServerClockEstimateMs(),
        });
        this.reportAudioState(audio, prev.currPlayItemUniqueId);
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
        if (!this.audio || !this.isAudioReady || !this.playbackState) return;
        if (this.isThisDeviceActive && this.playbackState.isPlaying) {
            this.playAudio();
        } else {
            this.pauseAudio();
        }
    }

    private playAudio(): void {
        const audio = this.audio;
        if (!audio) return;
        this.playOrPauseGuard.beginOp();
        // e.g. a pause is still fading out. play() would cut the sound for a moment
        if (!audio.paused) {
            this.playbackHandlers!.fadeIn();
            return;
        }
        void this.tryPlay();
    }

    private pauseAudio(): void {
        const audio = this.audio;
        if (!audio) return;
        const pauseOpId = this.playOrPauseGuard.beginOp();
        void (async () => {
            await this.playbackHandlers!.fadeOut();
            if (this.playOrPauseGuard.isOpStale(pauseOpId)) return;
            audio.pause();
        })();
    }

    private seekAudioElement(targetMs: number): void {
        const audio = this.audio;
        if (!audio || !this.isAudioReady) return;
        if (Math.abs(targetMs - audio.currentTime * 1000) <= SEEK_CHANGE_MIN_MS) return;

        const seekOpId = this.seekGuard.beginOp();
        void (async () => {
            await this.playbackHandlers!.fadeOut();
            if (this.seekGuard.isOpStale(seekOpId)) return;
            audio.currentTime = targetMs / 1000;
            this.playbackHandlers!.fadeIn();
        })();
    }

    // a load pauses the element, and the element fires pause right before ended.
    // Neither of them is a real pause
    private reportableAudio(): HTMLAudioElement | null {
        const audio = this.audio;
        if (!audio || !this.isThisDeviceActive || !this.isAudioReady || audio.ended) return null;
        return audio;
    }

    private reportAudioState(audio: HTMLAudioElement, currPlayItemUniqueId: string): void {
        this.playbackHandlers!.sendActiveDeviceReport({
            curr_play_item_unique_id: currPlayItemUniqueId,
            is_playing: !audio.paused,
            song_pos_ms: Math.round(audio.currentTime * 1000),
        });
    }

    private updateHeartbeat(): void {
        const shouldRun = this.isThisDeviceActive && this.audio !== null;
        if (!shouldRun) {
            this.stopHeartbeat();
            return;
        }
        if (this.heartbeatIntervalId !== null) return;
        this.heartbeatIntervalId = window.setInterval(
            () => this.sendHeartbeatReport(),
            REPORT_HEARTBEAT_MS,
        );
    }

    private stopHeartbeat(): void {
        if (this.heartbeatIntervalId === null) return;
        window.clearInterval(this.heartbeatIntervalId);
        this.heartbeatIntervalId = null;
    }

    // does not write playbackState. It can run during the pause fade while the audio
    // still plays, and would flip the button back
    private sendHeartbeatReport(): void {
        const audio = this.reportableAudio();
        const state = this.playbackState;
        if (!audio || !state || audio.paused) return;
        this.reportAudioState(audio, state.currPlayItemUniqueId);
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
                await this.tryPlay();
                if (this.loadGuard.isOpStale(loadOpId)) return;
            }
            // reported only after tryPlay, since before it the audio is still paused,
            // and a failed play fires no event
            this.handleAudioStateChange();
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

    private setPlaybackState(next: LocalPlaybackState | null): void {
        this.playbackState = next;
        this.refreshView();
    }

    private refreshView(): void {
        const base = this.playbackState;
        const next = base && !this.isThisDeviceActive ? this.withPending(base) : base;
        if (next === this.viewState) return;
        this.viewState = next;
        this.notify();
    }

    // covers the time until the active tab reports the request back.
    // Without it, an older report could flip the button or move the slider back for a moment
    private withPending(base: LocalPlaybackState): LocalPlaybackState {
        let state = base;
        const seek = this.pendingSeek;
        if (seek) {
            state = { ...state, positionMs: seek.targetMs, serverTsMs: seek.releasedAtServerMs };
        }
        const pending = this.pendingIsPlaying;
        if (pending && pending.isPlaying !== state.isPlaying) {
            state = { ...rebasePlaybackStateToNow(state), isPlaying: pending.isPlaying };
        }
        return state;
    }

    private dropSettledPending(snapshot: LocalPlaybackState | null): void {
        const seek = this.pendingSeek;
        if (seek && snapshot?.currPlayItemUniqueId !== seek.currPlayItemUniqueId) {
            this.clearPendingSeek();
        } else if (seek && snapshot) {
            const shownMs = calculatePlaybackStatePosMs(this.withPending(snapshot));
            const snapshotMs = calculatePlaybackStatePosMs(snapshot);
            if (Math.abs(snapshotMs - shownMs) <= PENDING_SEEK_TOLERANCE_MS)
                this.clearPendingSeek();
        }

        const pending = this.pendingIsPlaying;
        if (pending && snapshot && pending.isPlaying === snapshot.isPlaying) {
            this.clearPendingIsPlaying();
        }
    }

    private setPendingIsPlaying(isPlaying: boolean): void {
        this.clearPendingIsPlaying();
        const timeoutId = window.setTimeout(() => {
            this.pendingIsPlaying = null;
            this.refreshView();
        }, PENDING_TIMEOUT_MS);
        this.pendingIsPlaying = { isPlaying, timeoutId };
        this.refreshView();
    }

    private clearPendingIsPlaying(): void {
        if (!this.pendingIsPlaying) return;
        window.clearTimeout(this.pendingIsPlaying.timeoutId);
        this.pendingIsPlaying = null;
    }

    private setPendingSeek(targetMs: number, currPlayItemUniqueId: string): void {
        this.clearPendingSeek();
        const timeoutId = window.setTimeout(() => {
            this.pendingSeek = null;
            this.refreshView();
        }, PENDING_TIMEOUT_MS);
        this.pendingSeek = {
            targetMs,
            releasedAtServerMs: getServerClockEstimateMs(),
            currPlayItemUniqueId,
            timeoutId,
        };
        this.refreshView();
    }

    private clearPendingSeek(): void {
        if (!this.pendingSeek) return;
        window.clearTimeout(this.pendingSeek.timeoutId);
        this.pendingSeek = null;
    }
}
