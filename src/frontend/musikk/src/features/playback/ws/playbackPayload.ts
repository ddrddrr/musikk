import { CollectionSong } from "@/features/collections/types.ts";
import { LocalPlaybackState } from "@/features/playback/types.ts";

export interface ServerPlaybackState {
    current_song_uuid: string;
    curr_play_item_unique_id: string;
    is_playing: boolean;
    last_known_song_pos_ms: number;
    last_known_song_pos_updated_at_server_ms: number;
}

export interface PlaybackSnapshotPayload {
    server_ts_ms?: number;
    playback_state?: ServerPlaybackState | null;
    current_song: CollectionSong | null;
}

// curr_play_item_unique_id is required together with song_pos_ms
export interface PlaybackSetPayload {
    is_playing?: boolean;
    song_pos_ms?: number;
    curr_play_item_unique_id?: string;
}

export interface ActiveDeviceReportPayload {
    curr_play_item_unique_id: string;
    is_playing: boolean;
    song_pos_ms: number;
}

export function updatedLocalPlaybackWithServerSnapshot(
    prev: LocalPlaybackState | null,
    payload: PlaybackSnapshotPayload,
): LocalPlaybackState | null {
    const next = buildLocalPlaybackState(payload.current_song, payload.playback_state);
    return reuseIfUnchanged(prev, next);
}

function buildLocalPlaybackState(
    currentSong: CollectionSong | null,
    serverPlaybackState: ServerPlaybackState | null | undefined,
): LocalPlaybackState | null {
    if (!currentSong || !serverPlaybackState) return null;
    if (serverPlaybackState.current_song_uuid !== currentSong.uuid) return null;
    return {
        collectionSong: currentSong,
        isPlaying: serverPlaybackState.is_playing,
        positionMs: serverPlaybackState.last_known_song_pos_ms,
        serverTsMs: serverPlaybackState.last_known_song_pos_updated_at_server_ms,
        currPlayItemUniqueId: serverPlaybackState.curr_play_item_unique_id,
    };
}

// check values since we construct a new obj and a ref check would fail
function reuseIfUnchanged(
    prev: LocalPlaybackState | null,
    next: LocalPlaybackState | null,
): LocalPlaybackState | null {
    if (!prev || !next) return next;
    if (
        prev.collectionSong.uuid === next.collectionSong.uuid &&
        prev.isPlaying === next.isPlaying &&
        prev.positionMs === next.positionMs &&
        prev.serverTsMs === next.serverTsMs &&
        prev.currPlayItemUniqueId === next.currPlayItemUniqueId
    ) {
        return prev;
    }
    return next;
}
