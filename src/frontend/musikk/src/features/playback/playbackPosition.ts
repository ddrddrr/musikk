import { getServerClockEstimateMs } from "@/features/playback/serverClock.ts";
import { LocalPlaybackState } from "@/features/playback/types.ts";

export function calculatePlaybackStatePosMs(state: LocalPlaybackState): number {
    if (!state.isPlaying) return state.positionMs;
    // "server-time" elapsed since the snapshot was taken == how much further the song has played
    const songProgressSinceSnapshotMs = getServerClockEstimateMs() - state.serverTsMs;
    return state.positionMs + songProgressSinceSnapshotMs;
}
