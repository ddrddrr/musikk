import { getErrorDetail } from "@/api/errorUtils.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { addToLikedSongs } from "@/features/collections/api/mutations.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { userKeys } from "@/features/user/api/queryKeys.ts";
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
    const userUUID = useUserUUID();
    const addToLikedSongsMutation = useMutation({
        mutationFn: addToLikedSongs,
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: userKeys.collectionsPersonal(userUUID),
            });
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to like song"));
        },
    });

    const iconSize = Math.floor(size * 0.6);

    function handleClick(collectionSong: CollectionSong) {
        if (collectionSong.song.is_liked) {
            return; // TODO: remove from liked
        }
        addToLikedSongsMutation.mutate({ collectionSongUUID: collectionSong.uuid });
    }

    return (
        <Button
            variant={collectionSong.song.is_liked ? "brand" : "muted"}
            size="icon"
            onClick={() => handleClick(collectionSong)}
            style={{ width: size, height: size }}
            className={className}
        >
            {collectionSong.song.is_liked ? <Check size={iconSize} /> : <Plus size={iconSize} />}
        </Button>
    );
}
