import { CollectionSong } from "@/features/collections/types.ts";
import { ThisDevice } from "@/features/playback/hooks/useCurrentDevice.ts";
import { createContext, Dispatch, SetStateAction } from "react";

export interface PlaybackContextProps {
    thisDevice: ThisDevice | undefined;
    isThisDeviceActive: boolean;
    isPlaybackActive: boolean;
    setIsPlaybackActive: Dispatch<SetStateAction<boolean>> | undefined;
    playingCollectionSong: CollectionSong | undefined;
    queueHead: CollectionSong | null;
    queueError: Error | null;
    queueRefetch: () => void;
}

export const PlaybackContext = createContext<PlaybackContextProps>({
    thisDevice: undefined,
    isThisDeviceActive: false,
    isPlaybackActive: false,
    setIsPlaybackActive: undefined,
    playingCollectionSong: undefined,
    queueHead: null,
    queueError: null,
    queueRefetch: () => {},
});
