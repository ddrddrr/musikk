import { CollectionSong } from "@/features/collections/types.ts";
import { useAddSong } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { BetweenHorizonalStart } from "lucide-react";
import { toast } from "sonner";

interface SongAddToQueueButtonProps {
    collectionSong: CollectionSong;
    size?: number;
    className?: string;
}

export function SongAddToQueueButton({
    collectionSong,
    size = 40,
    className = "",
}: SongAddToQueueButtonProps) {
    const addSongMutation = useAddSong();
    const iconSize = Math.floor(size * 0.6);

    return (
        <IconTooltip label="Queue">
            <Button
                variant="muted"
                size="icon"
                aria-label="Add to queue"
                onClick={() =>
                    addSongMutation.mutate(collectionSong.uuid, {
                        onSuccess: () => toast.success("Added to queue"),
                    })
                }
                disabled={addSongMutation.isPending}
                style={{ width: size, height: size }}
                className={className}
            >
                <BetweenHorizonalStart size={iconSize} />
            </Button>
        </IconTooltip>
    );
}
