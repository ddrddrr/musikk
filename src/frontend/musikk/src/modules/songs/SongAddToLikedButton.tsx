import { addToLikedSongs } from "@/modules/song-collections/mutations.ts";
import { ICollectionSong } from "@/modules/song-collections/types.ts";
import { Button } from "@/modules/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";

interface SongCardProps {
    collectionSong: ICollectionSong;
    className?: string;
    size?: number;
}

export function SongAddToLikedButton({ collectionSong, className = "", size = 40 }: SongCardProps) {
    const addToLikedSongsMutation = useMutation({ mutationFn: addToLikedSongs });

    const iconSize = Math.floor(size * 0.6);

    const renderAddIcon = () => {
        return collectionSong.song.is_liked ? <Check size={iconSize} /> : <Plus size={iconSize} />;
    };

    function handleClick(collectionSong: ICollectionSong) {
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
            className={`p-0 flex items-center justify-center ${className}`}
        >
            {renderAddIcon()}
        </Button>
    );
}
