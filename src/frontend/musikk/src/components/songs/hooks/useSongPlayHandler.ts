import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { useHandlePlay } from "@/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { useCallback, useContext } from "react";

export function useSongPlayHandler(collectionSong: ISongCollectionSong) {
    const { playbackState, playingCollectionSong } = useContext(PlaybackContext);
    const handlePlay = useHandlePlay();

    const isThisChosen = collectionSong.uuid === playingCollectionSong?.uuid;
    const isPlaying = playbackState?.is_playing;

    const onClick = useCallback(() => {
        if (isThisChosen) {
            handlePlay();
        } else {
            handlePlay({ newSong: collectionSong });
        }
    }, [isThisChosen, collectionSong, handlePlay]);

    return {
        isThisPlaying: isThisChosen && isPlaying,
        onClick,
    };
}
