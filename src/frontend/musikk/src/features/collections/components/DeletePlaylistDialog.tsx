import { Button } from "@/features/ui/button.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/features/ui/dialog.tsx";

interface DeletePlaylistDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    playlistTitle: string;
    onConfirm: () => void;
    isDeleting: boolean;
}

export function DeletePlaylistDialog({
    open,
    onOpenChange,
    playlistTitle,
    onConfirm,
    isDeleting,
}: DeletePlaylistDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete playlist</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete &quot;{playlistTitle}&quot;? This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="muted"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
