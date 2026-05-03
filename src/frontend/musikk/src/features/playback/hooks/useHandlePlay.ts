import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { useCurrentDevice } from "@/features/playback/hooks/useCurrentDevice.ts";
import { useDeviceList } from "@/features/playback/hooks/useDeviceList.ts";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import {
    usePlaybackActions,
    useSetDeviceActiveAction,
} from "@/features/playback/ws/actionHooks.ts";
import {
    usePlayCollection,
    usePlaySong,
    useQueue,
    useQueueNext,
} from "@/features/song-queue/hooks/useQueueAPI.ts";
import { useContext } from "react";

export function useHandlePlay() {
    const { playingCollectionSong, isPlaybackActive } = useContext(PlaybackContext);
    const device = useCurrentDevice();
    const { activeDevice } = useDeviceList();
    const setDeviceActiveAction = useSetDeviceActiveAction();
    const { activatePlaybackAction, stopPlaybackAction } = usePlaybackActions();
    const playSongMutation = usePlaySong();
    const playCollectionMutation = usePlayCollection();
    const { data: queue } = useQueue();
    const nextMutation = useQueueNext();

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
        if (!device.id) return;

        if (!activeDevice) {
            setDeviceActiveAction(device);
        }

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

        const hasQueuedItems =
            (queue?.items.length ?? 0) > 0 || (queue?.context_items.length ?? 0) > 0;
        if (hasQueuedItems) {
            try {
                await nextMutation.mutateAsync();
            } catch {
                return;
            }
            activatePlaybackAction();
            return;
        }

        stopPlaybackAction();
    }

    return handlePlay;
}
