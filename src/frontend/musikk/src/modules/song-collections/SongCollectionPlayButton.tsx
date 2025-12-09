import { useCollectionPlayHandler } from "@/modules/song-collections/hooks/useCollectionPlayHandler.tsx";
import { ICollectionDetailed } from "@/modules/song-collections/types";
import { Button } from "@/modules/ui/button";
import { Pause, Play } from "lucide-react";

interface SongCollectionPlayButtonProps {
    collection: ICollectionDetailed;
    showComments: boolean;
}

export function SongCollectionPlayButton({
    collection,
    showComments,
}: SongCollectionPlayButtonProps) {
    const { isThisPlaying, onClick } = useCollectionPlayHandler(collection);

    const renderPlayPauseIcon = () => {
        return isThisPlaying ? <Pause size={20} /> : <Play size={20} />;
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
