import { CollectionSong } from "@/features/collections/types.ts";
import { ActionButtonSize } from "@/features/common/types.ts";
import { SongAddToLikedButton } from "@/features/songs/components/SongAddToLikedButton.tsx";
import { SongAddToQueueButton } from "@/features/songs/components/SongAddToQueueButton.tsx";
import { SongMenuButton } from "@/features/songs/components/SongMenuButton.tsx";
import { SongPlayButton } from "@/features/songs/components/SongPlayButton.tsx";
import { cn } from "@/lib/utils.ts";
import { ReactNode } from "react";

const GAP_BY_SIZE: Record<ActionButtonSize, string> = { sm: "gap-1", md: "gap-2" };

type DefaultSongActionsProps = {
    collectionSong: CollectionSong;
    size?: ActionButtonSize;
    playButton?: ReactNode;
    showRemoveFromPlaylist?: boolean;
    showAddToLiked?: boolean;
    onRemoveFromQueue?: () => void;
};

export function DefaultSongActions({
    collectionSong,
    size = "md",
    playButton,
    showRemoveFromPlaylist = false,
    showAddToLiked = true,
    onRemoveFromQueue,
}: DefaultSongActionsProps) {
    return (
        <div className={cn("flex items-center", GAP_BY_SIZE[size])}>
            {playButton ?? <SongPlayButton collectionSong={collectionSong} size={size} />}
            {showAddToLiked && <SongAddToLikedButton collectionSong={collectionSong} size={size} />}
            <SongAddToQueueButton collectionSong={collectionSong} size={size} />
            <SongMenuButton
                collectionSong={collectionSong}
                size={size}
                showRemoveFromPlaylist={showRemoveFromPlaylist}
                onRemoveFromQueue={onRemoveFromQueue}
            />
        </div>
    );
}
