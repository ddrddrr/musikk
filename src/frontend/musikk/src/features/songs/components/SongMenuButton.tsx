import { CollectionSong } from "@/features/collections/types.ts";
import { ActionButtonSize } from "@/features/common/types.ts";
import { useSongMenuItems } from "@/features/songs/hooks/useSongMenuItems.ts";
import { Button } from "@/features/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { EllipsisVertical } from "lucide-react";
import { SongAddToPlaylistSubmenu } from "./SongAddToPlaylistSubmenu.tsx";

interface SongMenuButtonProps {
    collectionSong: CollectionSong;
    size?: ActionButtonSize;
    showRemoveFromPlaylist?: boolean;
    onRemoveFromQueue?: () => void;
}

export function SongMenuButton({
    collectionSong,
    size = "md",
    showRemoveFromPlaylist = false,
    onRemoveFromQueue,
}: SongMenuButtonProps) {
    const items = useSongMenuItems(collectionSong, { showRemoveFromPlaylist, onRemoveFromQueue });

    return (
        <DropdownMenu>
            <IconTooltip label="More Actions">
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size={`icon-${size}`}
                        aria-label="More Actions"
                        className="hover:text-accent-foreground"
                    >
                        <EllipsisVertical />
                    </Button>
                </DropdownMenuTrigger>
            </IconTooltip>
            <DropdownMenuContent className="w-48">
                <SongAddToPlaylistSubmenu collectionSong={collectionSong} />
                {items.map(({ key, label, icon: Icon, variant, onSelect }) => (
                    <DropdownMenuItem key={key} variant={variant} onSelect={onSelect}>
                        <Icon className="mr-2 size-4" />
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
