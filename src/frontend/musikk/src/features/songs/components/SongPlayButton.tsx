import { CollectionSong } from "@/features/collections/types.ts";
import { ActionButtonSize } from "@/features/common/types.ts";
import { useSongPlayHandler } from "@/features/songs/hooks/useSongPlayHandler.ts";
import { Button } from "@/features/ui/button.tsx";
import { Pause, Play } from "lucide-react";

interface SongPlayButtonProps {
    collectionSong: CollectionSong;
    size?: ActionButtonSize;
}

export function SongPlayButton({ collectionSong, size = "md" }: SongPlayButtonProps) {
    const { isThisPlaying, onClick } = useSongPlayHandler(collectionSong);

    return (
        <Button
            variant="brand"
            size={`icon-${size}`}
            aria-label={isThisPlaying ? "Pause" : "Play"}
            onClick={onClick}
        >
            {isThisPlaying ? <Pause /> : <Play />}
        </Button>
    );
}
