import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/dialog.tsx";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCollectionCreation } from "../hooks/useCollectionCreation.ts";
import { CollectionForm } from "./CollectionForm.tsx";

type PlaylistCreateDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (playlistUUID: string) => void;
};

export function PlaylistCreateDialog({ open, onOpenChange, onSuccess }: PlaylistCreateDialogProps) {
    const navigate = useNavigate();

    const { form, submit, isSubmitting } = useCollectionCreation({
        type: "playlist",
        onSuccess: (collection) => {
            onOpenChange(false);
            toast.success("Playlist created");
            void navigate(`/collection/${collection.uuid}/`);
            onSuccess?.(collection.uuid);
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
