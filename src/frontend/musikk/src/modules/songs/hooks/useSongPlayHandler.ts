import { useHandlePlay } from "@/modules/playback/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/modules/playback/providers/playbackContext.ts";
import { CollectionSong } from "@/modules/song-collections/types.ts";
import { useCallback, useContext } from "react";

export function useSongPlayHandler(collectionSong: CollectionSong) {
    const { isPlaybackActive, playingCollectionSong } = useContext(PlaybackContext);
    const handlePlay = useHandlePlay();

    const isThisChosen = collectionSong.uuid === playingCollectionSong?.uuid;

    const onClick = useCallback(() => {
        if (isThisChosen) {
            handlePlay();
        } else {
            handlePlay({ newSong: collectionSong });
        }
    }, [isThisChosen, collectionSong, handlePlay]);

    return {
        isThisPlaying: isThisChosen && isPlaybackActive,
        onClick,
    };
}
