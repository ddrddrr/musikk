import { useCollectionPlayHandler } from "@/features/collections/hooks/useCollectionPlayHandler.ts";
import { CollectionDetailed } from "@/features/collections/types.ts";
import { ActionButtonSize } from "@/features/common/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { Pause, Play } from "lucide-react";

interface CollectionPlayButtonProps {
    collection: CollectionDetailed;
    size: ActionButtonSize;
}

export function CollectionPlayButton({ collection, size }: CollectionPlayButtonProps) {
    const { isThisCollectionPlaying, onClick } = useCollectionPlayHandler(collection);

    return (
        <Button
            variant="brand"
            size={`icon-${size}`}
            aria-label={isThisCollectionPlaying ? "Pause" : "Play"}
            onClick={onClick}
        >
            {isThisCollectionPlaying ? <Pause /> : <Play />}
        </Button>
    );
}
