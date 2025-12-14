import { useCollectionPlayHandler } from "@/modules/song-collections/hooks/useCollectionPlayHandler.tsx";
import { CollectionDetailed } from "@/modules/song-collections/types.ts";
import { Button } from "@/modules/ui/button.tsx";
import { Pause, Play } from "lucide-react";

interface SongCollectionPlayButtonProps {
    collection: CollectionDetailed;
    showComments: boolean;
}

export function SongCollectionPlayButton({
    collection,
    showComments,
}: SongCollectionPlayButtonProps) {
    const { isThisCollectionPlaying, onClick } = useCollectionPlayHandler(collection);

    const renderPlayPauseIcon = () => {
        return isThisCollectionPlaying ? <Pause size={20} /> : <Play size={20} />;
    };
    return (
        <Button
            variant="brand"
            size="icon"
            onClick={onClick}
            className={`p-0 flex items-center justify-center ${showComments ? "h-8 w-8" : "h-12 w-12"}`}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
