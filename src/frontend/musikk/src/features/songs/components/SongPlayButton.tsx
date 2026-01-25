import { CollectionSong } from "@/features/collections/types.ts";
import { useSongPlayHandler } from "@/features/songs/hooks/useSongPlayHandler.ts";
import { Button } from "@/features/ui/button.tsx";
import { Pause, Play } from "lucide-react";

interface SongPlayButtonProps {
    collectionSong: CollectionSong;
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
            className={`flex items-center justify-center p-0 ${className}`}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
