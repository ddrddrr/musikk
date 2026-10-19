import { LocalPlaybackState } from "@/features/playback/types.ts";
import { LocalAudioOutput } from "@/features/player/controller/LocalAudioOutput.ts";
import { PendingRequests } from "@/features/player/controller/PendingRequests.ts";
import { PlaybackHost, PlaybackMode } from "@/features/player/controller/PlaybackMode.ts";

// the mode of every tab that does not play the audio. It shows the last snapshot
// and sends its requests through the server
export class RemotePlayback implements PlaybackMode {
    private readonly host: PlaybackHost;
    private readonly output: LocalAudioOutput;
    private readonly pending: PendingRequests;

    constructor(host: PlaybackHost, output: LocalAudioOutput) {
        this.host = host;
        this.output = output;
        this.pending = new PendingRequests(() => host.refreshView());
    }

    enter(): void {
        void this.output.unload();
    }

    exit(): void {
        this.pending.clear();
    }

    view(): LocalPlaybackState | null {
        const state = this.host.getServerState();
        return state ? this.pending.applyTo(state) : null;
    }

    onSnapshot(next: LocalPlaybackState | null): void {
        this.pending.dropSettled(next);
        this.host.refreshView();
    }

    // the server sends playback.set only to the active device
    applyCommand(): void {}

    setIsPlaying(isPlaying: boolean): void {
        this.pending.setIsPlaying(isPlaying);
        this.host.refreshView();
        this.host.sendSet({ is_playing: isPlaying });
    }

    seek(positionMs: number): void {
        const state = this.host.getServerState();
        if (!state) return;
        this.pending.setSeek(positionMs, state.currPlayItemUniqueId);
        this.host.refreshView();
        this.host.sendSet({
            song_pos_ms: Math.round(positionMs),
            curr_play_item_unique_id: state.currPlayItemUniqueId,
        });
    }

    playAfterSongChange(): void {
        this.setIsPlaying(true);
    }

    // the unloaded audio element of this tab can still fire pause
    onAudioStateChange(): void {}
}
