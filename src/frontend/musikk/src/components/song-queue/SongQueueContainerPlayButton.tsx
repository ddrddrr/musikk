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
            style={{ width: size, height: size }}
            className={`bg-red-600 hover:bg-red-700 text-white border-2 border-black flex items-center justify-center rounded-sm p-0 ${className}`}
            onClick={onClick}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
