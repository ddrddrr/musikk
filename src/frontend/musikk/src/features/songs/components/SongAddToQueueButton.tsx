import { CollectionSong } from "@/features/collections/types.ts";
import { useQueueAddAPI } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { Button } from "@/features/ui/button.tsx";
import { BetweenHorizonalStart } from "lucide-react";

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
    const addToQueueMutation = useQueueAddAPI();
    const iconSize = Math.floor(size * 0.6);

    return (
        <Button
            variant="muted"
            size="icon"
            onClick={() =>
                addToQueueMutation.mutate({
                    type: "song",
                    item: collectionSong,
                    action: "add",
                })
            }
            disabled={addToQueueMutation.isPending}
            style={{ width: size, height: size }}
            className={`flex items-center justify-center p-0 ${className}`}
        >
            <BetweenHorizonalStart size={iconSize} />
        </Button>
    );
}
