import { useCollectionPlayHandler } from "@/components/song-collections/hooks/useCollectionPlayHandler.tsx";
import { ISongCollectionDetailed } from "@/components/song-collections/types";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";

interface SongCollectionPlayButtonProps {
    collection: ISongCollectionDetailed;
    showComments: boolean;
}

export function SongCollectionPlayButton({ collection, showComments }: SongCollectionPlayButtonProps) {
    const { isThisPlaying, onClick } = useCollectionPlayHandler(collection);

    const renderPlayPauseIcon = () => {
        return isThisPlaying ? <Pause size={20} /> : <Play size={20} />;
    };
    return (
        <Button
            className={`bg-red-600 hover:bg-red-700 text-white border-2
             border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              p-0 flex items-center justify-center ${showComments ? "h-8 w-8" : "h-12 w-12"}`}
            onClick={onClick}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
