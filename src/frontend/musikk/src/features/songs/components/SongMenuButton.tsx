import { CollectionSong } from "@/features/collections/types.ts";
import { ActionButtonSize } from "@/features/common/types.ts";
import { SongAddToPlaylistSubmenu } from "@/features/songs/components/SongAddToPlaylistSubmenu.tsx";
import { useSongMenuItems } from "@/features/songs/hooks/useSongMenuItems.ts";
import { Button } from "@/features/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { IconTooltip } from "@/features/ui/tooltip.tsx";
import { EllipsisVertical } from "lucide-react";

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
