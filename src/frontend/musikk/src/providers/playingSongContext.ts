import { ISong } from "@/components/songs/types.ts";
import { createContext, Dispatch, SetStateAction } from "react";

export interface PlayingSongContextProps {
    playingSong: ISong | null;
    setPlayingSong: Dispatch<SetStateAction<ISong | null>> | null;
    handleSongPlayClick: ((song: ISong) => void) | null;
}

export const PlayingSongContext = createContext<PlayingSongContextProps>({
    playingSong: null,
    setPlayingSong: null,
    handleSongPlayClick: null,
});
