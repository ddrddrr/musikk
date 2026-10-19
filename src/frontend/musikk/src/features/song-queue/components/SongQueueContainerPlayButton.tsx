import { ActionButtonSize } from "@/features/common/types.ts";
import { useQueuePlayHandler } from "@/features/song-queue/hooks/useQueuePlayHandler.ts";
import { QueueItem } from "@/features/song-queue/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { Play } from "lucide-react";

interface SongQueuePlayButtonProps {
    item: QueueItem;
    size?: ActionButtonSize;
}

export function SongQueuePlayButton({ item, size = "md" }: SongQueuePlayButtonProps) {
    const { onClick } = useQueuePlayHandler(item);

    return (
        <Button variant="brand" size={`icon-${size}`} onClick={onClick}>
            <Play />
        </Button>
    );
}
