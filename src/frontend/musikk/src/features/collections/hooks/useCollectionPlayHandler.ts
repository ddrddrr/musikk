import { Collection } from "@/features/collections/types";
import { useHandlePlay } from "@/features/playback/hooks/useHandlePlay.ts";
import { usePlayback } from "@/features/playback/hooks/usePlayback.ts";
import { useCallback } from "react";

export function useCollectionPlayHandler(collection: Collection) {
    const { isPlaybackActive, playbackState } = usePlayback();
    const handlePlay = useHandlePlay();

    const isThisCollectionChosen = collection.uuid === playbackState?.collectionSong.collection;

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
