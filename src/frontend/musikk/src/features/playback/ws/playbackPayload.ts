import { CollectionSong } from "@/features/collections/types.ts";
import { LocalPlaybackState } from "@/features/playback/types.ts";

export interface ServerPlaybackState {
    current_song_uuid: string | null;
    is_playing: boolean;
    last_known_song_pos_ms: number;
    last_known_at_server_ms: number;
    version: number;
}

export interface PlaybackSeekPayload {
    server_ts_ms?: number;
    playback_state?: ServerPlaybackState | null;
}

export interface PlaybackSnapshotPayload extends PlaybackSeekPayload {
    current_song: CollectionSong | null;
}

export function updatedLocalPlaybackWithServerSnapshot(
    prev: LocalPlaybackState | null,
    payload: PlaybackSnapshotPayload,
): LocalPlaybackState | null {
    const next = buildLocalPlaybackState(payload.current_song, payload.playback_state);
    if (!next) return null;
    if (prev && next.version < prev.version) return prev;
    return reuseIfUnchanged(prev, next);
}

export function updatedLocalPlaybackWithServerSeek(
    prev: LocalPlaybackState | null,
    payload: PlaybackSeekPayload,
): LocalPlaybackState | null {
    if (!prev || !payload.playback_state) return prev;
    const serverPlaybackState = payload.playback_state;
    if (serverPlaybackState.current_song_uuid !== prev.collectionSong.uuid) return prev;
    if (serverPlaybackState.version < prev.version) return prev;
    const next: LocalPlaybackState = {
        ...prev,
        isPlaying: serverPlaybackState.is_playing,
        positionMs: serverPlaybackState.last_known_song_pos_ms,
        serverTsMs: serverPlaybackState.last_known_at_server_ms,
        version: serverPlaybackState.version,
    };
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
        serverTsMs: serverPlaybackState.last_known_at_server_ms,
        version: serverPlaybackState.version,
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
        prev.version === next.version
    ) {
        return prev;
    }
    return next;
}
