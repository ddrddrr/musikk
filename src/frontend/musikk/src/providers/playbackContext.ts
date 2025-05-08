import { ISong } from "@/components/songs/types.ts";
import { UUID } from "@/config/types.ts";
import { IPlaybackState } from "@/playback/types.ts";
import { createContext } from "react";

export interface PlaybackContextProps {
    playbackState: IPlaybackState | undefined;
    playingSong: ISong | undefined;
    playingCollectionUUID: UUID | undefined;
}

export const PlaybackContext = createContext<PlaybackContextProps>({
    playbackState: undefined,
    playingSong: undefined,
    playingCollectionUUID: undefined,
});
