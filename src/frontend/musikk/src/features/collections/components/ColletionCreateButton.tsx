import { Button } from "@/features/ui/button.tsx";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PlaylistCreateDialog } from "./PlaylistCreateDialog.tsx";

export function ColletionCreateButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant={"outline"} className={"p-2"} onClick={() => setOpen(true)}>
                <Plus size={20} />
            </Button>
            <PlaylistCreateDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
