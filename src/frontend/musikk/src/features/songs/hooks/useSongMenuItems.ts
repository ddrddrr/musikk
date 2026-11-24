import { useRemoveSongFromCollection } from "@/features/collections/api/mutations.ts";
import { CollectionSong, CollectionType } from "@/features/collections/types.ts";
import { useAddSong } from "@/features/song-queue/api/mutations.ts";
import { useSongPlayHandler } from "@/features/songs/hooks/useSongPlayHandler.ts";
import type { LucideIcon } from "lucide-react";
import { BetweenHorizonalStart, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SongMenuItem {
    key: string;
    label: string;
    icon: LucideIcon;
    variant: "default" | "destructive";
    onSelect: () => void;
}

interface SongMenuItemsOptions {
    removableFrom?: CollectionType;
    onRemoveFromQueue?: () => void;
}

interface RemoveSongDialogState {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isDeleting: boolean;
}

interface SongMenu {
    items: SongMenuItem[];
    removeDialog: RemoveSongDialogState;
}

const REMOVE_LABEL_BY_TYPE: Record<CollectionType, string> = {
    playlist: "Remove from playlist",
    album: "Remove from album",
    liked: "Remove from liked songs",
    history: "Remove from history",
};

/**
 * Describes the song actions without rendering them, so the dropdown menu and the context menu show the
 * same items and each renders them with its own menu primitives.
 *
 * Removing a song from an album deletes the song for every user, so on an album that item only opens
 * `removeDialog`. A caller that passes `removableFrom` has to render that dialog.
 */
export function useSongMenuItems(
    collectionSong: CollectionSong,
    { removableFrom, onRemoveFromQueue }: SongMenuItemsOptions = {},
): SongMenu {
    const removeSongMutation = useRemoveSongFromCollection();
    const addSongMutation = useAddSong();
    const { onClick: onPlay } = useSongPlayHandler(collectionSong);
    const [isRemoveDialogOpen, setRemoveDialogOpen] = useState(false);

    const items: SongMenuItem[] = [
        {
            key: "add-to-queue",
            label: "Add to queue",
            icon: BetweenHorizonalStart,
            variant: "default",
            onSelect: () =>
                addSongMutation.mutate(collectionSong.uuid, {
                    onSuccess: () => toast.success("Added to queue"),
                }),
        },
        { key: "play", label: "Play", icon: Play, variant: "default", onSelect: onPlay },
    ];

    const collectionUUID = collectionSong.collection;
    const removeSong = () => {
        if (!collectionUUID) return;
        removeSongMutation.mutate(
            { collectionUUID, songCollectionSongUUID: collectionSong.uuid },
            { onSuccess: () => setRemoveDialogOpen(false) },
        );
    };
    const openRemoveDialog = () => setRemoveDialogOpen(true);

    if (removableFrom && collectionUUID) {
        items.push({
            key: "remove-from-collection",
            label: REMOVE_LABEL_BY_TYPE[removableFrom],
            icon: Trash2,
            variant: "destructive",
            onSelect: removableFrom === "album" ? openRemoveDialog : removeSong,
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

    return {
        items,
        removeDialog: {
            open: isRemoveDialogOpen,
            onOpenChange: setRemoveDialogOpen,
            onConfirm: removeSong,
            isDeleting: removeSongMutation.isPending,
        },
    };
}
