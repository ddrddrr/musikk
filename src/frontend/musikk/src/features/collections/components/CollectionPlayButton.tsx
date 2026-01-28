import { useCollectionPlayHandler } from "@/features/collections/hooks/useCollectionPlayHandler.ts";
import { CollectionDetailed } from "@/features/collections/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { Pause, Play } from "lucide-react";

interface SongCollectionPlayButtonProps {
    collection: CollectionDetailed;
    showComments: boolean;
}

export function CollectionPlayButton({ collection, showComments }: SongCollectionPlayButtonProps) {
    const { isThisCollectionPlaying, onClick } = useCollectionPlayHandler(collection);

    const renderPlayPauseIcon = () => {
        return isThisCollectionPlaying ? <Pause size={20} /> : <Play size={20} />;
    };
    return (
        <Button
            variant="brand"
            size="icon"
            onClick={onClick}
            className={`flex items-center justify-center p-0 ${showComments ? "h-8 w-8" : "h-12 w-12"}`}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
