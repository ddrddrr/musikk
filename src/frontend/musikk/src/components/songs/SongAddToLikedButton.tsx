import { addToLikedSongs } from "@/components/song-collections/mutations.ts";
import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";

interface SongCardProps {
    collectionSong: ISongCollectionSong;
    className?: string;
    size?: number;
}

export function SongAddToLikedButton({ collectionSong, className = "", size = 40 }: SongCardProps) {
    const addToLikedSongsMutation = useMutation({ mutationFn: addToLikedSongs });

    const iconSize = Math.floor(size * 0.6);

    const renderAddIcon = () => {
        return collectionSong.song.is_liked ? <Check size={iconSize} /> : <Plus size={iconSize} />;
    };

    function handleClick(collectionSong: ISongCollectionSong) {
        if (collectionSong.song.is_liked) {
            return; // TODO: remove from liked
        }
        addToLikedSongsMutation.mutate({ collectionSongUUID: collectionSong.uuid });
    }

    return (
        <Button
            onClick={() => handleClick(collectionSong)}
            style={{ width: size, height: size }}
            className={`bg-gray-200 hover:bg-gray-300 text-black border-2 border-black rounded-sm flex items-center justify-center p-0 ${className}`}
        >
            {renderAddIcon()}
        </Button>
    );
}
