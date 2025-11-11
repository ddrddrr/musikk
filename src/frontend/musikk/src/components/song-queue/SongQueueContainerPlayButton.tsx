import { useQueuePlayHandler } from "@/components/song-queue/hooks/useQueuePlayHandler.ts";
import { ISongQueueNode } from "@/components/song-queue/types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Pause, Play } from "lucide-react";

interface SongQueuePlayButtonProps {
    node: ISongQueueNode;
    className?: string;
    size?: number;
}

export function SongQueuePlayButtonButton({ node, className = "", size = 20 }: SongQueuePlayButtonProps) {
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
