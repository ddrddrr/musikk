import { CollectionSong } from "@/features/collections/types.ts";
import { SongAddToLikedButton } from "@/features/songs/components/SongAddToLikedButton.tsx";
import { SongAddToQueueButton } from "@/features/songs/components/SongAddToQueueButton.tsx";
import { SongMenuButton } from "@/features/songs/components/SongMenuButton.tsx";
import { SongPlayButton } from "@/features/songs/components/SongPlayButton.tsx";
import { cn } from "@/lib/utils.ts";

export const songButtonProps = {
    compact: { size: 28, padding: "p-1", gap: "gap-1", iconSize: "text-lg" },
    normal: { size: 40, padding: "p-2", gap: "gap-2", iconSize: "text-xl" },
} as const;

type DefaultSongActionsProps = {
    collectionSong: CollectionSong;
    size?: "compact" | "normal";
    showRemoveFromPlaylist?: boolean;
};

export function DefaultSongActions({
    collectionSong,
    size = "normal",
    showRemoveFromPlaylist = false,
}: DefaultSongActionsProps) {
    const btn = songButtonProps[size];
    return (
        <div className={cn("flex items-center", btn.gap)}>
            <SongPlayButton
                collectionSong={collectionSong}
                size={btn.size}
                className={btn.padding}
            />
            <SongAddToLikedButton
                collectionSong={collectionSong}
                size={btn.size}
                className={btn.padding}
            />
            <SongAddToQueueButton
                collectionSong={collectionSong}
                size={btn.size}
                className={btn.padding}
            />
            <SongMenuButton
                collectionSong={collectionSong}
                size={btn.size}
                className={btn.padding}
                iconSize={btn.iconSize}
                showRemoveFromPlaylist={showRemoveFromPlaylist}
            />
        </div>
    );
}
