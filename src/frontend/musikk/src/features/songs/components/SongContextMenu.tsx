import { CollectionSong } from "@/features/collections/types.ts";
import { useSongActions } from "@/features/songs/hooks/useSongActions.ts";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuPortal,
    ContextMenuTrigger,
} from "@/features/ui/context-menu.tsx";
import { BetweenHorizonalStart, Play, Trash2 } from "lucide-react";
import { JSX } from "react";

interface SongContextMenuProps {
    children: JSX.Element | JSX.Element[];
    song: CollectionSong;
    onRemoveFromQueue?: () => void;
}

export function SongContextMenu({ children, song, onRemoveFromQueue }: SongContextMenuProps) {
    const { onPlay, addSongMutation } = useSongActions(song);

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuPortal>
                <ContextMenuContent panel="card" className="w-48">
                    {onRemoveFromQueue && (
                        <ContextMenuItem onSelect={onRemoveFromQueue}>
                            <Trash2 className="mr-2 size-4" />
                            Remove from queue
                        </ContextMenuItem>
                    )}
                    <ContextMenuItem onSelect={() => addSongMutation.mutate(song.uuid)}>
                        <BetweenHorizonalStart className="mr-2 size-4" />
                        Add to queue
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={onPlay}>
                        <Play className="mr-2 size-4" />
                        Play
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenuPortal>
        </ContextMenu>
    );
}
