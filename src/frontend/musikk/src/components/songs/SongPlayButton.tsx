import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { useSongPlayHandler } from "@/components/songs/hooks/useSongPlayHandler.ts";
import { Button } from "@/components/ui/button.tsx";
import { Pause, Play } from "lucide-react";

interface SongPlayButtonProps {
    collectionSong: ISongCollectionSong;
    className?: string;
    size?: number;
}

export function SongPlayButton({ collectionSong, className = "", size = 20 }: SongPlayButtonProps) {
    const { isThisPlaying, onClick } = useSongPlayHandler(collectionSong);

    const renderPlayPauseIcon = () => {
        const iconSize = Math.floor(size * 0.6);
        return isThisPlaying ? <Pause size={iconSize} /> : <Play size={iconSize} />;
    };

    return (
        <Button
            style={{ width: size, height: size }}
            className={`bg-red-600 hover:bg-red-700 text-white border-2 border-black flex items-center justify-center rounded-sm p-0 ${className}`}
            onClick={onClick}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
