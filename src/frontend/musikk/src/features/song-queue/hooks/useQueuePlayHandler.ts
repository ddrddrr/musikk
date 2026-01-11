import { useHandlePlay } from "@/features/playback/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { SongQueueNode } from "@/features/song-queue/api/types.ts";
import { useCallback, useContext } from "react";

export function useQueuePlayHandler(node: SongQueueNode) {
    const { isPlaybackActive, queueHead } = useContext(PlaybackContext);
    const handlePlay = useHandlePlay();

    const isThisChosen = queueHead?.uuid === node?.uuid;

    const onClick = useCallback(() => {
        if (isThisChosen) {
            handlePlay();
        } else {
            handlePlay({ newSong: node.collection_song });
        }
    }, [isThisChosen, node, handlePlay]);

    return {
        isThisPlaying: isThisChosen && isPlaybackActive,
        onClick,
    };
}
