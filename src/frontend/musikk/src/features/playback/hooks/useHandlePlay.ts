import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { useCurrentDevice } from "@/features/playback/hooks/useCurrentDevice.ts";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { usePlaybackActions } from "@/features/playback/ws/actionHooks.ts";
import { usePlayCollection, usePlaySong } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { useContext } from "react";

export function useHandlePlay() {
    const { playingCollectionSong, isPlaybackActive } = useContext(PlaybackContext);
    const { getDeviceID } = useCurrentDevice();
    const { activatePlaybackAction, stopPlaybackAction } = usePlaybackActions();
    const playSongMutation = usePlaySong();
    const playCollectionMutation = usePlayCollection();

    async function playItem({
        newCollection,
        newSong,
    }: {
        newCollection?: Collection;
        newSong?: CollectionSong;
    } = {}) {
        try {
            if (newCollection) {
                await playCollectionMutation.mutateAsync(newCollection.uuid);
            } else if (newSong) {
                await playSongMutation.mutateAsync(newSong.uuid);
            }
        } catch {
            // onError in the mutation hooks already shows a toast
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
        // TODO: probably remove this check
        if (!getDeviceID()) return;

        if (newCollection || newSong) {
            await playItem({ newCollection, newSong });
            return;
        }

        if (playingCollectionSong) {
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
