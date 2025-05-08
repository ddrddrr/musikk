import { ISongCollection, ISongCollectionSong } from "@/components/song-collections/types.ts";
import { useQueueAddAPI } from "@/hooks/useQueueAPI.ts";
import { usePlaybackActivateMutation, usePlaybackStopMutation } from "@/playback/mutations.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { useContext } from "react";

export function useHandlePlay() {
    const { playbackState } = useContext(PlaybackContext);
    const playbackActivateMutation = usePlaybackActivateMutation();
    const playbackStopMutation = usePlaybackStopMutation();
    const addToQueueMutation = useQueueAddAPI();

    async function handlePlay({
        newCollection,
        newSong,
    }: {
        newCollection?: ISongCollection;
        newSong?: ISongCollectionSong;
    } = {}) {
        const deviceID = localStorage.getItem("deviceID");
        if (!deviceID) return;

        if (newCollection || newSong) {
            if (newCollection) {
                try {
                    await addToQueueMutation.mutateAsync({
                        type: "collection",
                        item: newCollection,
                        action: "setHead",
                    });
                } catch (error) {
                    console.error("Queue add failed", error);
                    return;
                }
            } else if (newSong) {
                try {
                    await addToQueueMutation.mutateAsync({
                        type: "song",
                        item: newSong,
                        action: "setHead",
                    });
                } catch (error) {
                    console.error("Queue add failed", error);
                    return;
                }
            }
            playbackActivateMutation.mutate({ deviceID });
            return;
        }

        if (playbackState?.is_playing) {
            playbackStopMutation.mutate();
        } else {
            playbackActivateMutation.mutate({ deviceID });
        }
    }

    return handlePlay;
}
