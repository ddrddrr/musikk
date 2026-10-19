import { useLikeSong, useUnlikeSong } from "@/features/collections/api/mutations.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { useIsSongLiked } from "@/features/user/hooks/useUserLikes.ts";
import { Check, Plus } from "lucide-react";

interface SongCardProps {
    collectionSong: CollectionSong;
    className?: string;
    size?: number;
}

export function SongAddToLikedButton({ collectionSong, className = "", size = 40 }: SongCardProps) {
    const isLiked = useIsSongLiked(collectionSong.song.uuid);
    const likeSongMutation = useLikeSong();
    const unlikeSongMutation = useUnlikeSong();

    const iconSize = Math.floor(size * 0.6);

    function handleClick(collectionSong: CollectionSong) {
        if (isLiked) {
            unlikeSongMutation.mutate({ collectionSongUUID: collectionSong.uuid });
            return;
        }
        likeSongMutation.mutate({ collectionSongUUID: collectionSong.uuid });
    }

    return (
        <IconTooltip label={isLiked ? "Liked" : "Like"}>
            <Button
                variant={isLiked ? "brand" : "muted"}
                size="icon"
                aria-label={isLiked ? "Liked" : "Like"}
                onClick={() => handleClick(collectionSong)}
                style={{ width: size, height: size }}
                className={className}
            >
                {isLiked ? <Check size={iconSize} /> : <Plus size={iconSize} />}
            </Button>
        </IconTooltip>
    );
}
