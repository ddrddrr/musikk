import { ISongCollection } from "@/components/song-collections/types";
import { useHandlePlay } from "@/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/providers/playbackContext";
import { useCallback, useContext } from "react";

export function useCollectionPlayHandler(collection: ISongCollection) {
    const { playbackState, playingCollectionSong } = useContext(PlaybackContext);
    const handlePlay = useHandlePlay();

    const isThisChosen = collection.uuid === playingCollectionSong?.song_collection;
    const isPlaying = playbackState?.is_playing;

    const onClick = useCallback(() => {
        if (isThisChosen) {
            handlePlay();
        } else {
            handlePlay({ newCollection: collection });
        }
    }, [isThisChosen, collection, handlePlay]);

    return {
        isThisPlaying: isThisChosen && isPlaying,
        onClick,
    };
}
