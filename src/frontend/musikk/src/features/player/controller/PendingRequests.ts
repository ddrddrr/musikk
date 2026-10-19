import {
    calculatePlaybackStatePosMs,
    rebasePlaybackStateToNow,
} from "@/features/playback/playbackPosition.ts";
import { getServerClockEstimateMs } from "@/features/playback/serverClock.ts";
import { LocalPlaybackState } from "@/features/playback/types.ts";

const PENDING_TIMEOUT_MS = 5000;
const PENDING_SEEK_TOLERANCE_MS = 1000;

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

// holds the requests of a non-active tab until the active tab reports them back.
// Without it, an older report could flip the button or move the slider back for a moment
export class PendingRequests {
    private readonly onExpire: () => void;
    private pendingIsPlaying: PendingIsPlaying | null = null;
    private pendingSeek: PendingSeek | null = null;

    constructor(onExpire: () => void) {
        this.onExpire = onExpire;
    }

    setIsPlaying(isPlaying: boolean): void {
        this.clearIsPlaying();
        const timeoutId = window.setTimeout(() => {
            this.pendingIsPlaying = null;
            this.onExpire();
        }, PENDING_TIMEOUT_MS);
        this.pendingIsPlaying = { isPlaying, timeoutId };
    }

    setSeek(targetMs: number, currPlayItemUniqueId: string): void {
        this.clearSeek();
        const timeoutId = window.setTimeout(() => {
            this.pendingSeek = null;
            this.onExpire();
        }, PENDING_TIMEOUT_MS);
        this.pendingSeek = {
            targetMs,
            releasedAtServerMs: getServerClockEstimateMs(),
            currPlayItemUniqueId,
            timeoutId,
        };
    }

    // returns state itself when nothing is pending, so useSyncExternalStore gets the same object
    applyTo(state: LocalPlaybackState): LocalPlaybackState {
        let next = state;
        const seek = this.pendingSeek;
        if (seek) {
            next = { ...next, positionMs: seek.targetMs, serverTsMs: seek.releasedAtServerMs };
        }
        const pending = this.pendingIsPlaying;
        if (pending && pending.isPlaying !== next.isPlaying) {
            next = { ...rebasePlaybackStateToNow(next), isPlaying: pending.isPlaying };
        }
        return next;
    }

    dropSettled(snapshot: LocalPlaybackState | null): void {
        const seek = this.pendingSeek;
        if (seek && snapshot?.currPlayItemUniqueId !== seek.currPlayItemUniqueId) {
            this.clearSeek();
        } else if (seek && snapshot) {
            const shownMs = calculatePlaybackStatePosMs(this.applyTo(snapshot));
            const snapshotMs = calculatePlaybackStatePosMs(snapshot);
            if (Math.abs(snapshotMs - shownMs) <= PENDING_SEEK_TOLERANCE_MS) this.clearSeek();
        }

        const pending = this.pendingIsPlaying;
        if (pending && snapshot && pending.isPlaying === snapshot.isPlaying) {
            this.clearIsPlaying();
        }
    }

    clear(): void {
        this.clearIsPlaying();
        this.clearSeek();
    }

    private clearIsPlaying(): void {
        if (!this.pendingIsPlaying) return;
        window.clearTimeout(this.pendingIsPlaying.timeoutId);
        this.pendingIsPlaying = null;
    }

    private clearSeek(): void {
        if (!this.pendingSeek) return;
        window.clearTimeout(this.pendingSeek.timeoutId);
        this.pendingSeek = null;
    }
}
