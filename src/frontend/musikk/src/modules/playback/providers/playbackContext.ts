import { IPlaybackState } from "@/modules/playback/types.ts";
import { ISongCollectionSong } from "@/modules/song-collections/types.ts";
import { ISongQueueNode } from "@/modules/song-queue/types.ts";
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
