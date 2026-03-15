import { addToLikedSongs } from "@/features/collections/api/mutations.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { useMutation } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";

interface SongCardProps {
    collectionSong: CollectionSong;
    className?: string;
    size?: number;
}

export function SongAddToLikedButton({ collectionSong, className = "", size = 40 }: SongCardProps) {
    const addToLikedSongsMutation = useMutation({ mutationFn: addToLikedSongs });

    const iconSize = Math.floor(size * 0.6);

    const renderAddIcon = () => {
        return collectionSong.song.is_liked ? <Check size={iconSize} /> : <Plus size={iconSize} />;
    };

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
            {renderAddIcon()}
        </Button>
    );
}
