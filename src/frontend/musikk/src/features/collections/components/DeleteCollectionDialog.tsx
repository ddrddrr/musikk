import { CollectionDetailed } from "@/features/collections/types.ts";
import { ConfirmDeleteDialog } from "@/features/common/ConfirmDeleteDialog.tsx";

interface DeleteCollectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    collection: CollectionDetailed;
    onConfirm: () => void;
    isDeleting: boolean;
}

export function DeleteCollectionDialog({
    collection,
    ...dialogProps
}: DeleteCollectionDialogProps) {
    const songsNote =
        collection.type === "album"
            ? " Its songs are deleted too, also from the playlists of other users."
            : "";

    return (
        <ConfirmDeleteDialog
            {...dialogProps}
            title={`Delete ${collection.type}`}
            description={`Are you sure you want to delete "${collection.title}"?${songsNote} This action cannot be undone.`}
        />
    );
}
