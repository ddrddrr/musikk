import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { useCurrentDevice } from "@/features/playback/hooks/useCurrentDevice.ts";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { usePlaybackActions } from "@/features/playback/ws/actionHooks.ts";
import { useQueueAddAPI } from "@/features/song-queue/hooks/useQueueAPI.ts";
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
        newCollection?: Collection;
        newSong?: CollectionSong;
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
        } catch {
            // useQueueAddAPI.onError already shows a toast to the user
            return;
        }

        activatePlaybackAction();
        return;
    }

    async function handlePlay({
        newCollection,
        newSong,
    }: {
        newCollection?: Collection;
        newSong?: CollectionSong;
    } = {}) {
        if (!getDeviceID()) return;

        if (newCollection || newSong) {
            await playItem({ newCollection, newSong });
            return;
        }

        if (queueHead) {
            if (isPlaybackActive) {
                stopPlaybackAction();
            } else {
                activatePlaybackAction();
            }
            return;
        }
        // no item in the queue -> should be stopped
        stopPlaybackAction();
    }

    return handlePlay;
}
