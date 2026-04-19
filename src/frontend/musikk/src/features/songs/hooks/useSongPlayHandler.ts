import { CollectionSong } from "@/features/collections/types.ts";
import { useHandlePlay } from "@/features/playback/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { useContext } from "react";

export function useSongPlayHandler(collectionSong: CollectionSong) {
    const { isPlaybackActive, playingCollectionSong } = useContext(PlaybackContext);
    const handlePlay = useHandlePlay();

    const isThisChosen = collectionSong.uuid === playingCollectionSong?.uuid;

    const onClick = () => {
        if (isThisChosen) {
            handlePlay();
        } else {
            handlePlay({ newSong: collectionSong });
        }
    };

    return {
        isThisPlaying: isThisChosen && isPlaybackActive,
        onClick,
    };
}
