import { useCurrentDevice } from "@/modules/playback/hooks/useCurrentDevice.ts";
import { PlaybackContext } from "@/modules/playback/providers/playbackContext.ts";
import { usePlaybackActions } from "@/modules/playback/ws/actionHooks.ts";
import { ICollection, ICollectionSong } from "@/modules/song-collections/types.ts";
import { useQueueAddAPI } from "@/modules/song-queue/hooks/useQueueAPI.ts";
import { useContext } from "react";

export function useHandlePlay() {
    const { queueHead, isPlaybackActive } = useContext(PlaybackContext);
    const { getDeviceID } = useCurrentDevice();
    const { activatePlaybackAction, stopPlaybackAction } = usePlaybackActions();
    const addToQueueMutation = useQueueAddAPI();

    async function playItem({
        newCollection,
        newSong,
    }: {
        newCollection?: ICollection;
        newSong?: ICollectionSong;
    } = {}) {
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

        activatePlaybackAction();
        return;
    }

    async function handlePlay({
        newCollection,
        newSong,
    }: {
        newCollection?: ICollection;
        newSong?: ICollectionSong;
    } = {}) {
        if (!getDeviceID()) return;

        if (newCollection || newSong) {
            playItem({ newCollection, newSong });
            return;
        }

        if (queueHead) {
            if (isPlaybackActive) {
                stopPlaybackAction();
            } else {
                activatePlaybackAction();
            }
        }
        // if no item in queue do not change state (should be stopped)
    }

    return handlePlay;
}
