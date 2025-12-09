import { useHandlePlay } from "@/modules/playback/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/modules/playback/providers/playbackContext.ts";
import { ICollection } from "@/modules/song-collections/types";
import { useCallback, useContext } from "react";

export function useCollectionPlayHandler(collection: ICollection) {
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
