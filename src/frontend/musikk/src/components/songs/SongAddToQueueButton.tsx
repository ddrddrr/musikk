import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { Button } from "@/components/ui/button.tsx";
import { useQueueAddAPI } from "@/components/song-queue/hooks/useQueueAPI";
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
            onClick={() =>
                addToQueueMutation.mutate({
                    type: "song",
                    item: collectionSong,
                    action: "add",
                })
            }
            disabled={addToQueueMutation.isPending}
            style={{ width: size, height: size }}
            className={`bg-gray-200 hover:bg-gray-300 text-black border-2 border-black rounded-sm p-0 flex items-center justify-center ${className}`}
        >
            <BetweenHorizonalStart size={iconSize} />
        </Button>
    );
}
