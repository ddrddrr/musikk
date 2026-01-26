import { Button } from "@/features/ui/button.tsx";
import { useState } from "react";
import { PlaylistCreateDialog } from "./PlaylistCreateDialog.tsx";

export function ColletionCreateButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}>Create Playlist</Button>
            <PlaylistCreateDialog
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}
