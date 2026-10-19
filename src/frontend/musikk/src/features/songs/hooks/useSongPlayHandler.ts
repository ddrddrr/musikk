import { CollectionSong } from "@/features/collections/types.ts";
import { useHandlePlay } from "@/features/playback/hooks/useHandlePlay.ts";
import { usePlayback } from "@/features/playback/hooks/usePlayback.ts";

export function useSongPlayHandler(collectionSong: CollectionSong) {
    const { isPlaybackActive, playbackState } = usePlayback();
    const handlePlay = useHandlePlay();

    const isThisChosen = collectionSong.uuid === playbackState?.collectionSong.uuid;
    const onClick = () => {
        if (isThisChosen) {
            void handlePlay();
        } else {
            void handlePlay({ newSong: collectionSong });
        }
    };

    return {
        isThisPlaying: isThisChosen && isPlaybackActive,
        onClick,
    };
}
