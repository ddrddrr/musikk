import { addToLikedSongs } from "@/components/collections/mutations.ts";
import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";

interface SongCardProps {
    collectionSong: ISongCollectionSong;
    className?: string;
    size?: number;
}

export function SongAddToLikedButton({ collectionSong, className = "", size = 18 }: SongCardProps) {
    const addToLikedSongsMutation = useMutation({ mutationFn: addToLikedSongs });

    const renderAddIcon = () => {
        return collectionSong.song.is_liked ? <Check size={size} /> : <Plus size={size} />;
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
            className={`bg-gray-200 hover:bg-gray-300 text-black rounded-sm flex items-center justify-center ${className}`}
        >
            {renderAddIcon()}
        </Button>
    );
}
