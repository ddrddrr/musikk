import { ISongCollectionDetailed } from "@/components/song-collections/types.ts";
import { createContext, Dispatch, SetStateAction } from "react";

export interface PlayingCollectionContextProps {
    playingCollection: ISongCollectionDetailed | null;
    setPlayingCollection: Dispatch<SetStateAction<ISongCollectionDetailed | null>> | null;
    handleCollectionPlayClick: ((collection: ISongCollectionDetailed) => void) | null;
}

export const PlayingCollectionContext = createContext<PlayingCollectionContextProps>({
    playingCollection: null,
    setPlayingCollection: null,
    handleCollectionPlayClick: null,
});
