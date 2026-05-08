import { CollectionSong } from "@/features/collections/types.ts";
import { LocalPlaybackState } from "@/features/playback/types.ts";

export interface ServerActivePlayback {
    current_song_uuid: string;
    play_instance_uuid: string;
    is_playing: boolean;
    last_known_song_pos_ms: number;
    last_known_at_server_ms: number;
}

export interface ServerPlaybackState {
    active: ServerActivePlayback | null;
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
    if (!prev) return prev;
    const serverPlaybackState = payload.playback_state;
    const active = serverPlaybackState?.active;
    if (!serverPlaybackState || !active) return prev;
    if (active.current_song_uuid !== prev.collectionSong.uuid) return prev;
    if (serverPlaybackState.version < prev.version) return prev;
    const next: LocalPlaybackState = {
        ...prev,
        isPlaying: active.is_playing,
        positionMs: active.last_known_song_pos_ms,
        serverTsMs: active.last_known_at_server_ms,
        version: serverPlaybackState.version,
        playInstanceUuid: active.play_instance_uuid,
    };
    return reuseIfUnchanged(prev, next);
}

function buildLocalPlaybackState(
    currentSong: CollectionSong | null,
    serverPlaybackState: ServerPlaybackState | null | undefined,
): LocalPlaybackState | null {
    const active = serverPlaybackState?.active;
    if (!currentSong || !serverPlaybackState || !active) return null;
    if (active.current_song_uuid !== currentSong.uuid) return null;
    return {
        collectionSong: currentSong,
        isPlaying: active.is_playing,
        positionMs: active.last_known_song_pos_ms,
        serverTsMs: active.last_known_at_server_ms,
        version: serverPlaybackState.version,
        playInstanceUuid: active.play_instance_uuid,
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
        prev.version === next.version &&
        prev.playInstanceUuid === next.playInstanceUuid
    ) {
        return prev;
    }
    return next;
}
