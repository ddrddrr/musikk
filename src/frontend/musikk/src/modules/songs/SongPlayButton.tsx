import { ISongCollectionSong } from "@/modules/song-collections/types.ts";
import { useSongPlayHandler } from "@/modules/songs/hooks/useSongPlayHandler.ts";
import { Button } from "@/modules/ui/button.tsx";
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
            variant="brand"
            size="icon"
            style={{ width: size, height: size }}
            onClick={onClick}
            className={`p-0 flex items-center justify-center ${className}`}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
