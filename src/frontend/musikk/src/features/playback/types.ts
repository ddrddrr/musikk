import { CollectionSong } from "@/features/collections/types.ts";

export interface IPlaybackDevice {
    id: string;
    name: string;
    is_active: boolean;
    volume: number;
}

// no playback == no localPlaybackState
// hence the song (and other values which do not make sense without it) is not nullable
export interface LocalPlaybackState {
    collectionSong: CollectionSong;
    isPlaying: boolean;
    positionMs: number;
    serverTsMs: number;
    version: number;
    playInstanceUuid: string;
}
