import { Collection } from "@/features/collections/types";
import { useHandlePlay } from "@/features/playback/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { useCallback, useContext } from "react";

export function useCollectionPlayHandler(collection: Collection) {
    const { isPlaybackActive, playingCollectionSong } = useContext(PlaybackContext);
    const handlePlay = useHandlePlay();

    const isThisCollectionChosen = collection.uuid === playingCollectionSong?.song_collection;

    const onClick = useCallback(() => {
        if (isThisCollectionChosen) {
            handlePlay();
        } else {
            handlePlay({ newCollection: collection });
        }
    }, [isThisCollectionChosen, collection, handlePlay]);

    return {
        isThisCollectionPlaying: isThisCollectionChosen && isPlaybackActive,
        onClick,
    };
}
