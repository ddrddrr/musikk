import { CollectionSong } from "@/features/collections/types.ts";
import { ActionButtonSize } from "@/features/common/types.ts";
import { useAddSong } from "@/features/song-queue/api/mutations.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { BetweenHorizonalStart } from "lucide-react";
import { toast } from "sonner";

interface SongAddToQueueButtonProps {
    collectionSong: CollectionSong;
    size?: ActionButtonSize;
}

export function SongAddToQueueButton({ collectionSong, size = "md" }: SongAddToQueueButtonProps) {
    const addSongMutation = useAddSong();

    return (
        <IconTooltip label="Queue">
            <Button
                variant="muted"
                size={`icon-${size}`}
                aria-label="Add to queue"
                onClick={() =>
                    addSongMutation.mutate(collectionSong.uuid, {
                        onSuccess: () => toast.success("Added to queue"),
                    })
                }
                disabled={addSongMutation.isPending}
            >
                <BetweenHorizonalStart />
            </Button>
        </IconTooltip>
    );
}
