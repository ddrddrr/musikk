import { ISongQueueNode } from "@/features/song-queue/api/types.ts";
import { useQueuePlayHandler } from "@/features/song-queue/hooks/useQueuePlayHandler.ts";
import { Button } from "@/features/ui/button.tsx";
import { Pause, Play } from "lucide-react";

interface SongQueuePlayButtonProps {
    node: ISongQueueNode;
    className?: string;
    size?: number;
}

export function SongQueuePlayButton({ node, className = "", size = 20 }: SongQueuePlayButtonProps) {
    const { isThisPlaying, onClick } = useQueuePlayHandler(node);

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
