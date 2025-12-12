import { useQueuePlayHandler } from "@/modules/song-queue/hooks/useQueuePlayHandler.ts";
import { ISongQueueNode } from "@/modules/song-queue/types.ts";
import { Button } from "@/modules/ui/button.tsx";
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
            className={`p-0 flex items-center justify-center ${className}`}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
