import { QueueItem } from "@/features/song-queue/api/types.ts";
import { useQueuePlayHandler } from "@/features/song-queue/hooks/useQueuePlayHandler.ts";
import { Button } from "@/features/ui/button.tsx";
import { Play } from "lucide-react";

interface SongQueuePlayButtonProps {
    item: QueueItem;
    className?: string;
    size?: number;
}

export function SongQueuePlayButton({ item, className = "", size = 20 }: SongQueuePlayButtonProps) {
    const { onClick } = useQueuePlayHandler(item);
    const iconSize = Math.floor(size * 0.6);

    return (
        <Button
            variant="brand"
            size="icon"
            style={{ width: size, height: size }}
            onClick={onClick}
            className={`flex items-center justify-center p-0 ${className}`}
        >
            <Play size={iconSize} />
        </Button>
    );
}
