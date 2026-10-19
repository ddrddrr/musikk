import { LocalPlaybackState } from "@/features/playback/types.ts";
import {
    ActiveDeviceReportPayload,
    PlaybackSetPayload,
} from "@/features/playback/ws/playbackPayload.ts";

export interface PlaybackHost {
    getServerState(): LocalPlaybackState | null;
    refreshView(): void;
    sendSet(payload: PlaybackSetPayload): void;
    sendActiveDeviceReport(payload: ActiveDeviceReportPayload): void;
}

// active and "remote" device would have similar operations that would do different things
export interface PlaybackMode {
    enter(): void;
    exit(): void;
    view(): LocalPlaybackState | null;
    onSnapshot(next: LocalPlaybackState | null): void;
    applyCommand(command: PlaybackSetPayload): void;
    setIsPlaying(isPlaying: boolean): void;
    seek(positionMs: number): void;
    playAfterSongChange(): void;
    onAudioStateChange(): void;
}
