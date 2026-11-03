import {
    calculatePlaybackStatePosMs,
    rebasePlaybackStateToNow,
} from "@/features/playback/playbackPosition.ts";
import { getServerClockEstimateMs } from "@/features/playback/serverClock.ts";
import { LocalPlaybackState } from "@/features/playback/types.ts";
import { PlaybackSetPayload } from "@/features/playback/ws/playbackPayload.ts";
import {
    AudioPlayState,
    LocalAudioOutput,
    SongLoudness,
} from "@/features/player/controller/LocalAudioOutput.ts";
import { PlaybackHost, PlaybackMode } from "@/features/player/controller/PlaybackMode.ts";
import { getUrlForSong } from "@/features/player/getUrlForSong.ts";

// other tabs move the position forward with the clock, but the real audio can fall behind,
// e.g. when the browser lags or the tab sleeps in the background,
// so the active tab sends its real position regularly while it plays
const REPORT_HEARTBEAT_MS = 10000;

export class ActivePlayback implements PlaybackMode {
    private readonly host: PlaybackHost;
    private readonly output: LocalAudioOutput;
    // written from the audio element, because only the audio knows the real state
    private audioState: LocalPlaybackState | null = null;
    private heartbeatIntervalId: number | null = null;

    constructor(host: PlaybackHost, output: LocalAudioOutput) {
        this.host = host;
        this.output = output;
    }

    // ??= keeps a command that arrived before init, while the audio was not attached yet.
    // init() calls enter() a second time, and ??= keeps a single heartbeat
    enter(): void {
        this.audioState ??= this.host.getServerState();
        this.loadCurrentSong();
        this.heartbeatIntervalId ??= window.setInterval(
            () => this.sendHeartbeatReport(),
            REPORT_HEARTBEAT_MS,
        );
    }

    exit(): void {
        if (this.heartbeatIntervalId !== null) window.clearInterval(this.heartbeatIntervalId);
        this.heartbeatIntervalId = null;
        this.audioState = null;
    }

    view(): LocalPlaybackState | null {
        return this.audioState;
    }

    // a snapshot with the same play item is an echo of this tab's own report
    onSnapshot(next: LocalPlaybackState | null): void {
        if (next?.currPlayItemUniqueId === this.audioState?.currPlayItemUniqueId) return;
        this.setAudioState(next);
        this.loadCurrentSong();
    }

    applyCommand(command: PlaybackSetPayload): void {
        const prev = this.audioState;
        if (!prev) return;
        const seekMs =
            command.curr_play_item_unique_id === prev.currPlayItemUniqueId
                ? command.song_pos_ms
                : undefined;
        const isPlaying = command.is_playing;
        if (seekMs === undefined && isPlaying === undefined) return;

        if (!this.output.isReady) {
            // the load starts from the stored values
            const wanted = rebasePlaybackStateToNow(prev);
            if (seekMs !== undefined) wanted.positionMs = seekMs;
            if (isPlaying !== undefined) wanted.isPlaying = isPlaying;
            this.setAudioState(wanted);
            // the error toast asks the user to try again, and this command is that try
            if (this.output.hasLoadFailed) this.loadCurrentSong();
            return;
        }

        if (seekMs !== undefined) {
            this.setAudioState({
                ...prev,
                positionMs: seekMs,
                serverTsMs: getServerClockEstimateMs(),
            });
            this.output.seek(seekMs);
        }
        if (isPlaying === true) this.output.play();
        if (isPlaying === false) this.output.pause();
    }

    setIsPlaying(isPlaying: boolean): void {
        this.applyCommand({ is_playing: isPlaying });
    }

    seek(positionMs: number): void {
        const state = this.audioState;
        if (!state) return;
        this.applyCommand({
            song_pos_ms: Math.round(positionMs),
            curr_play_item_unique_id: state.currPlayItemUniqueId,
        });
    }

    // sent through the server even on the active tab: the HTTP response can arrive before
    // the snapshot with the new song, but the server forwards the command after that snapshot
    playAfterSongChange(): void {
        this.host.sendSet({ is_playing: true });
    }

    onAudioStateChange(): void {
        const audio = this.output.readReportableState();
        const prev = this.audioState;
        if (!audio || !prev) return;
        // this tab ignores its own echoes, so it has to write the real audio state itself
        this.setAudioState({
            ...prev,
            isPlaying: audio.isPlaying,
            positionMs: audio.positionMs,
            serverTsMs: getServerClockEstimateMs(),
        });
        this.report(audio, prev.currPlayItemUniqueId);
    }

    // does not write any state. It can run during the pause fade while the audio
    // still plays, and would flip the button back
    private sendHeartbeatReport(): void {
        const audio = this.output.readReportableState();
        const state = this.audioState;
        if (!audio || !state || !audio.isPlaying) return;
        this.report(audio, state.currPlayItemUniqueId);
    }

    private report(audio: AudioPlayState, currPlayItemUniqueId: string): void {
        this.host.sendActiveDeviceReport({
            curr_play_item_unique_id: currPlayItemUniqueId,
            is_playing: audio.isPlaying,
            song_pos_ms: Math.round(audio.positionMs),
        });
    }

    private setAudioState(next: LocalPlaybackState | null): void {
        this.audioState = next;
        this.host.refreshView();
    }

    private loadCurrentSong(): void {
        const collectionSong = this.audioState?.collectionSong;
        const url = collectionSong ? getUrlForSong(collectionSong) : undefined;
        if (collectionSong && url) {
            void this.loadAndReport(url, collectionSong.song);
        } else {
            void this.output.unload();
        }
    }

    private async loadAndReport(url: string, loudness: SongLoudness): Promise<void> {
        const isLoaded = await this.output.load(url, loudness, () => this.readStartPoint());
        if (isLoaded) this.onAudioStateChange();
    }

    // the server pauses when the active device changes, except when a play command
    // made this tab active. So isPlaying=true here means that the user pressed play
    private readStartPoint(): AudioPlayState | null {
        const state = this.audioState;
        if (!state) return null;
        return { positionMs: calculatePlaybackStatePosMs(state), isPlaying: state.isPlaying };
    }
}
