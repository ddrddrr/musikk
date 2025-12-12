import { ThisDevice } from "@/modules/playback/hooks/useCurrentDevice.ts";
import { ICollectionSong } from "@/modules/song-collections/types.ts";
import { ISongQueueNode } from "@/modules/song-queue/types.ts";
import { createContext } from "react";

export interface PlaybackContextProps {
    thisDevice: ThisDevice | undefined;
    isThisDeviceActive: boolean;
    isPlaybackActive: boolean;
    playingCollectionSong: ICollectionSong | undefined;
    queueHead: ISongQueueNode | undefined;
}

export const PlaybackContext = createContext<PlaybackContextProps>({
    thisDevice: undefined,
    isThisDeviceActive: false,
    isPlaybackActive: false,
    playingCollectionSong: undefined,
    queueHead: undefined,
});
