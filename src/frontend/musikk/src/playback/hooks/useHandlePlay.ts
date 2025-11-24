import { ISongCollection, ISongCollectionSong } from "@/modules/song-collections/types.ts";
import { useQueueAddAPI } from "@/modules/song-queue/hooks/useQueueAPI.ts";
import { useCurrentDevice } from "@/hooks/useCurrentDevice.ts";
import { usePlaybackStateMutation } from "@/playback/mutations.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { useContext } from "react";

export function useHandlePlay() {
    const { queueHead, playbackState } = useContext(PlaybackContext);
    const { getDeviceID } = useCurrentDevice();
    const playbackStateMutation = usePlaybackStateMutation();
    const addToQueueMutation = useQueueAddAPI();

    async function handlePlay({
        newCollection,
        newSong,
    }: {
        newCollection?: ISongCollection;
        newSong?: ISongCollectionSong;
    } = {}) {
        if (!getDeviceID()) return;

        if (newCollection || newSong) {
            try {
                if (newCollection) {
                    await addToQueueMutation.mutateAsync({
                        type: "collection",
                        item: newCollection,
                        action: "setHead",
                    });
                } else if (newSong) {
                    await addToQueueMutation.mutateAsync({
                        type: "song",
                        item: newSong,
                        action: "setHead",
                    });
                }
            } catch (error) {
                console.error("Queue add failed", error);
                return;
            }

            playbackStateMutation.mutate({ isPlaying: true });
            return;
        }

        if (queueHead) {
            if (playbackState?.is_playing) {
                playbackStateMutation.mutate({ isPlaying: false });
            } else {
                playbackStateMutation.mutate({ isPlaying: true });
            }
        }
    }

    return handlePlay;
}
