import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/dialog.tsx";
import { useCollectionCreation } from "../useCollectionCreation.ts";
import { CollectionForm } from "./CollectionForm.tsx";

type PlaylistCreateDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (playlistUUID: string) => void;
};

export function PlaylistCreateDialog({ open, onOpenChange, onSuccess }: PlaylistCreateDialogProps) {
    const { form, submit, isSubmitting } = useCollectionCreation({
        type: "playlist",
        onSuccess: (uuid) => {
            onOpenChange(false);
            onSuccess?.(uuid);
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Playlist</DialogTitle>
                </DialogHeader>

                <CollectionForm
                    form={form}
                    onSubmit={submit}
                    onCancel={() => onOpenChange(false)}
                    isSubmitting={isSubmitting}
                    submitLabel="Create Playlist"
                    showCancel={true}
                />
            </DialogContent>
        </Dialog>
    );
}
