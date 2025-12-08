import { useHandlePlay } from "@/modules/playback/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/modules/playback/providers/playbackContext.ts";
import { ISongQueueNode } from "@/modules/song-queue/types.ts";
import { useCallback, useContext } from "react";

export function useQueuePlayHandler(node: ISongQueueNode) {
    const { playbackState, queueHead } = useContext(PlaybackContext);
    const handlePlay = useHandlePlay();

    const isThisChosen = queueHead?.uuid === node?.uuid;
    const isPlaying = playbackState?.is_playing;

    const onClick = useCallback(() => {
        if (isThisChosen) {
            handlePlay();
        } else {
            handlePlay({ newSong: node.collection_song });
        }
    }, [isThisChosen, node, handlePlay]);

    return {
        isThisPlaying: isThisChosen && isPlaying,
        onClick,
    };
}
