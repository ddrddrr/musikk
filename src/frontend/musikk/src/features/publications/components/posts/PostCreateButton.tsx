import { UUID } from "@/api/types.ts";
import { PostCreateDialog } from "@/features/publications/components/posts/PostCreateDialog.tsx";
import { Button } from "@/features/ui/button.tsx";
import { Plus } from "lucide-react";
import { useState } from "react";

type PostCreateButtonProps = {
    feedUserUUID: UUID;
    onCreated?: () => void;
};

export function PostCreateButton({ feedUserUUID, onCreated }: PostCreateButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="outline" className="gap-2 px-3 py-2" onClick={() => setOpen(true)}>
                <Plus size={20} />
                <span className="text-sm">Write a post</span>
            </Button>
            <PostCreateDialog
                open={open}
                onOpenChange={setOpen}
                feedUserUUID={feedUserUUID}
                onCreated={onCreated}
            />
        </>
    );
}
