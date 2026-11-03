import { useRemoveSongFromCollection } from "@/features/collections/api/mutations.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { useAddSong } from "@/features/song-queue/api/mutations.ts";
import { useSongPlayHandler } from "@/features/songs/hooks/useSongPlayHandler.ts";
import type { LucideIcon } from "lucide-react";
import { BetweenHorizonalStart, Play, Trash2 } from "lucide-react";

export interface SongMenuItem {
    key: string;
    label: string;
    icon: LucideIcon;
    variant: "default" | "destructive";
    onSelect: () => void;
}

interface SongMenuItemsOptions {
    showRemoveFromPlaylist?: boolean;
    onRemoveFromQueue?: () => void;
}

/**
 * Describes the song actions without rendering them, so the dropdown menu and the context menu show the
 * same items and each renders them with its own menu primitives.
 */
export function useSongMenuItems(
    collectionSong: CollectionSong,
    { showRemoveFromPlaylist = false, onRemoveFromQueue }: SongMenuItemsOptions = {},
): SongMenuItem[] {
    const removeSongMutation = useRemoveSongFromCollection();
    const addSongMutation = useAddSong();
    const { onClick: onPlay } = useSongPlayHandler(collectionSong);

    const items: SongMenuItem[] = [
        {
            key: "add-to-queue",
            label: "Add to queue",
            icon: BetweenHorizonalStart,
            variant: "default",
            onSelect: () => addSongMutation.mutate(collectionSong.uuid),
        },
        { key: "play", label: "Play", icon: Play, variant: "default", onSelect: onPlay },
    ];

    const collectionUUID = collectionSong.collection;
    if (showRemoveFromPlaylist && collectionUUID) {
        items.push({
            key: "remove-from-playlist",
            label: "Remove from playlist",
            icon: Trash2,
            variant: "destructive",
            onSelect: () =>
                removeSongMutation.mutate({
                    collectionUUID,
                    songCollectionSongUUID: collectionSong.uuid,
                }),
        });
    }

    if (onRemoveFromQueue) {
        items.push({
            key: "remove-from-queue",
            label: "Remove from queue",
            icon: Trash2,
            variant: "destructive",
            onSelect: onRemoveFromQueue,
        });
    }

    return items;
}
