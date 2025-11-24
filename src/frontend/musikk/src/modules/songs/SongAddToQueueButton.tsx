import { ISongCollectionSong } from "@/modules/song-collections/types.ts";
import { Button } from "@/modules/ui/button.tsx";
import { useQueueAddAPI } from "@/modules/song-queue/hooks/useQueueAPI";
import { BetweenHorizonalStart } from "lucide-react";

interface SongAddToQueueButtonProps {
    collectionSong: ISongCollectionSong;
    size?: number;
    className?: string;
}

export function SongAddToQueueButton({ collectionSong, size = 40, className = "" }: SongAddToQueueButtonProps) {
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
            className={`p-0 flex items-center justify-center ${className}`}
        >
            <BetweenHorizonalStart size={iconSize} />
        </Button>
    );
}
