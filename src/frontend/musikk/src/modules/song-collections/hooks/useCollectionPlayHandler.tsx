import { useHandlePlay } from "@/modules/playback/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/modules/playback/providers/playbackContext.ts";
import { ICollection } from "@/modules/song-collections/types";
import { useCallback, useContext } from "react";

export function useCollectionPlayHandler(collection: ICollection) {
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
