import { ThisDevice } from "@/modules/playback/hooks/useCurrentDevice.ts";
import { ICollectionSong } from "@/modules/song-collections/types.ts";
import { ISongQueueNode } from "@/modules/song-queue/types.ts";
import { createContext, Dispatch, SetStateAction } from "react";

export interface PlaybackContextProps {
    thisDevice: ThisDevice | undefined;
    isThisDeviceActive: boolean;
    isPlaybackActive: boolean;
    setIsPlaybackActive: Dispatch<SetStateAction<boolean>> | undefined;
    playingCollectionSong: ICollectionSong | undefined;
    queueHead: ISongQueueNode | undefined;
}

export const PlaybackContext = createContext<PlaybackContextProps>({
    thisDevice: undefined,
    isThisDeviceActive: false,
    isPlaybackActive: false,
    setIsPlaybackActive: undefined,
    playingCollectionSong: undefined,
    queueHead: undefined,
});
