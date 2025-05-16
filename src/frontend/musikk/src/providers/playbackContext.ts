import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { IPlaybackState } from "@/playback/types.ts";
import { createContext } from "react";

export interface PlaybackContextProps {
    playbackState: IPlaybackState | undefined;
    playingCollectionSong: ISongCollectionSong | undefined;
    isThisDeviceActive: boolean;
}

export const PlaybackContext = createContext<PlaybackContextProps>({
    playbackState: undefined,
    playingCollectionSong: undefined,
    isThisDeviceActive: false,
});
