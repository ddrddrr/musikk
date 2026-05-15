import { getErrorDetail } from "@/api/errorUtils.ts";
import { addToLikedSongs, removeFromLikedSongs } from "@/features/collections/api/mutations.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { useIsSongLiked } from "@/features/user/hooks/useUserLikes.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";

interface SongCardProps {
    collectionSong: CollectionSong;
    className?: string;
    size?: number;
}

export function SongAddToLikedButton({ collectionSong, className = "", size = 40 }: SongCardProps) {
    const queryClient = useQueryClient();
    const isLiked = useIsSongLiked(collectionSong.song.uuid);

    const invalidateLikedSongs = () =>
        queryClient.invalidateQueries({ queryKey: userKeys.likedSongs });

    const addToLikedSongsMutation = useMutation({
        mutationFn: addToLikedSongs,
        onSuccess: () => {
            void invalidateLikedSongs();
            toast.success("Added to liked songs");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to like song"));
        },
    });

    const removeFromLikedSongsMutation = useMutation({
        mutationFn: removeFromLikedSongs,
        onSuccess: () => {
            void invalidateLikedSongs();
            toast.success("Removed from liked songs");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to remove from liked songs"));
        },
    });

    const iconSize = Math.floor(size * 0.6);

    function handleClick(collectionSong: CollectionSong) {
        if (isLiked) {
            removeFromLikedSongsMutation.mutate({ collectionSongUUID: collectionSong.uuid });
            return;
        }
        addToLikedSongsMutation.mutate({ collectionSongUUID: collectionSong.uuid });
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
