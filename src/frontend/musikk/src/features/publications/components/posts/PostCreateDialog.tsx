import { UUID } from "@/api/types.ts";
import { PostForm } from "@/features/publications/components/posts/PostForm.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/dialog.tsx";
import { toast } from "sonner";

type PostCreateDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    feedUserUUID: UUID;
    onCreated?: () => void;
};

export function PostCreateDialog({
    open,
    onOpenChange,
    feedUserUUID,
    onCreated,
}: PostCreateDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Write a Post</DialogTitle>
                </DialogHeader>
                <PostForm
                    feedUserUUID={feedUserUUID}
                    onSuccess={() => {
                        onOpenChange(false);
                        toast.success("Post created");
                        onCreated?.();
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
