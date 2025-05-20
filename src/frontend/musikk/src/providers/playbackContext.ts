import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { ISongQueueNode } from "@/components/song-queue/types.ts";
import { IPlaybackState } from "@/playback/types.ts";
import { createContext } from "react";

export interface PlaybackContextProps {
    playbackState: IPlaybackState | undefined;
    playingCollectionSong: ISongCollectionSong | undefined;
    queueHead: ISongQueueNode | undefined;
    isThisDeviceActive: boolean;
}

export const PlaybackContext = createContext<PlaybackContextProps>({
    playbackState: undefined,
    playingCollectionSong: undefined,
    queueHead: undefined,
    isThisDeviceActive: false,
});
