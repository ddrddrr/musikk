import { CollectionSong } from "@/features/collections/types.ts";
import { useSongMenuItems } from "@/features/songs/hooks/useSongMenuItems.ts";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuPortal,
    ContextMenuTrigger,
} from "@/features/ui/context-menu.tsx";
import { JSX } from "react";

interface SongContextMenuProps {
    children: JSX.Element | JSX.Element[];
    song: CollectionSong;
    onRemoveFromQueue?: () => void;
}

export function SongContextMenu({ children, song, onRemoveFromQueue }: SongContextMenuProps) {
    const { items } = useSongMenuItems(song, { onRemoveFromQueue });

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuPortal>
                <ContextMenuContent panel="card" className="w-48">
                    {items.map(({ key, label, icon: Icon, variant, onSelect }) => (
                        <ContextMenuItem key={key} variant={variant} onSelect={onSelect}>
                            <Icon className="mr-2 size-4" />
                            {label}
                        </ContextMenuItem>
                    ))}
                </ContextMenuContent>
            </ContextMenuPortal>
        </ContextMenu>
    );
}
