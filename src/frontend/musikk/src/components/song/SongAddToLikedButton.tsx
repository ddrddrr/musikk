import { addToLikedSongs } from "@/components/liked-songs/mutations";
import { ISong } from "@/components/song/types";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";

interface SongCardProps {
    song: ISong;
    className?: string;
    size?: number;
}

export function SongAddToLikedButton({ song, className = "", size = 18 }: SongCardProps) {
    const addToLikedSongsMutation = useMutation({ mutationFn: addToLikedSongs });

    const renderAddIcon = () => {
        return song.is_liked ? <Check size={size} /> : <Plus size={size} />;
    };

    function handleClick(song: ISong) {
        if (song.is_liked) {
            return; // remove from liked
        }
        addToLikedSongsMutation.mutate({ songUUID: song.uuid });
    }

    return (
        <Button
            onClick={() => handleClick(song)}
            className={`bg-gray-200 hover:bg-gray-300 text-black rounded-sm flex items-center justify-center ${className}`}
        >
            {renderAddIcon()}
        </Button>
    );
}
