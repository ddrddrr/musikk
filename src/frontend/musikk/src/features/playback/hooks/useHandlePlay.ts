import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { usePlayback } from "@/features/playback/hooks/usePlayback.ts";
import { usePlayerController } from "@/features/playback/hooks/usePlayerController.ts";
import {
    usePlayCollection,
    usePlaySong,
    useQueueNext,
} from "@/features/song-queue/api/mutations.ts";
import { useQueue } from "@/features/song-queue/api/queries.ts";

export function useHandlePlay() {
    const { playbackState, isPlaybackActive } = usePlayback();
    const controller = usePlayerController();
    const playingCollectionSong = playbackState?.collectionSong;
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

        controller.playAfterSongChange();
        return;
    }

    async function handlePlay({
        newCollection,
        newSong,
    }: {
        newCollection?: Collection;
        newSong?: CollectionSong;
    } = {}) {
        if (newCollection || newSong) {
            await playItem({ newCollection, newSong });
            return;
        }

        if (playingCollectionSong) {
            controller.setIsPlaying(!isPlaybackActive);
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
            controller.playAfterSongChange();
        }
    }

    return handlePlay;
}
