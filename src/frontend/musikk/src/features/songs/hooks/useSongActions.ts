import { useRemoveSongFromCollection } from "@/features/collections/api/mutations.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { useAddSong } from "@/features/song-queue/api/mutations.ts";
import { useSongPlayHandler } from "@/features/songs/hooks/useSongPlayHandler.ts";

export function useSongActions(collectionSong: CollectionSong) {
    const removeSongMutation = useRemoveSongFromCollection();
    const { onClick: onPlay } = useSongPlayHandler(collectionSong);
    const addSongMutation = useAddSong();

    return { removeSongMutation, onPlay, addSongMutation };
}
