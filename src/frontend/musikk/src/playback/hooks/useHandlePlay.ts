import { ISongCollection, ISongCollectionSong } from "@/components/song-collections/types.ts";
import { useCurrentDevice } from "@/hooks/useCurrentDevice.ts";
import { useQueueAddAPI } from "@/hooks/useQueueAPI.ts";
import { usePlaybackStateMutation } from "@/playback/mutations.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { useContext } from "react";

export function useHandlePlay() {
    const { playbackState } = useContext(PlaybackContext);
    const { deviceID } = useCurrentDevice();
    const playbackStateMutation = usePlaybackStateMutation();
    const addToQueueMutation = useQueueAddAPI();

    async function handlePlay({
        newCollection,
        newSong,
    }: {
        newCollection?: ISongCollection;
        newSong?: ISongCollectionSong;
    } = {}) {
        if (!deviceID) return;

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

        if (playbackState?.is_playing) {
            playbackStateMutation.mutate({ isPlaying: false });
        } else {
            playbackStateMutation.mutate({ isPlaying: true });
        }
    }

    return handlePlay;
}
