import { useLikeSong, useUnlikeSong } from "@/features/collections/api/mutations.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { ActionButtonSize } from "@/features/common/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { useIsSongLiked } from "@/features/user/hooks/useUserLikes.ts";
import { Check, Plus } from "lucide-react";

interface SongAddToLikedButtonProps {
    collectionSong: CollectionSong;
    size?: ActionButtonSize;
}

export function SongAddToLikedButton({ collectionSong, size = "md" }: SongAddToLikedButtonProps) {
    const isLiked = useIsSongLiked(collectionSong.song.uuid);
    const likeSongMutation = useLikeSong();
    const unlikeSongMutation = useUnlikeSong();

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
                size={`icon-${size}`}
                aria-label={isLiked ? "Liked" : "Like"}
                onClick={() => handleClick(collectionSong)}
            >
                {isLiked ? <Check /> : <Plus />}
            </Button>
        </IconTooltip>
    );
}
