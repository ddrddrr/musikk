import { SongPlayButton } from "@/components/song/SongPlayButton";
import { ISong } from "@/components/song/types";
import { useQueueAddAPI } from "@/hooks/useQueueAPI";
import { BetweenHorizonalStart } from "lucide-react";

interface SongCardProps {
    song: ISong;
    playButtonSize?: number;
    playButtonClass?: string;
    addButtonClass?: string;
    titleMaxWidth?: string;
    showImage?: boolean;
    showAddToQueueButton?: boolean;
}

export function SongCard({
    song,
    playButtonSize = 18,
    playButtonClass = "p-2",
    addButtonClass = "p-2",
    titleMaxWidth = "max-w-[200px]",
    showImage = true,
    showAddToQueueButton = true,
}: SongCardProps) {
    const addToQueueMutation = useQueueAddAPI();

    return (
        <div className="flex items-center justify-between w-full h-full">
            <div className="flex items-center gap-3">
                {showImage && (
                    <img
                        src={song.image || "/placeholder.svg"}
                        alt={song.title}
                        className="w-10 h-10 object-cover rounded-md border border-black"
                    />
                )}
                <div className="flex flex-col">
                    <p className={`font-bold text-sm text-black truncate ${titleMaxWidth}`}>{song.title}</p>
                    <p className={`text-xs text-gray-600 truncate ${titleMaxWidth}`}>{song.artist}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <SongPlayButton song={song} iconSize={playButtonSize} className={playButtonClass} />
                {showAddToQueueButton && (
                    <button
                        onClick={() => addToQueueMutation.mutate({ type: "song", item: song, action: "add" })}
                        disabled={addToQueueMutation.isPending}
                        className={`hover:bg-gray-200 rounded-full transition-colors ${addButtonClass}`}
                    >
                        <BetweenHorizonalStart size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
