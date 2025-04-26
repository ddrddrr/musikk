import { SongAddToLikedButton } from "@/components/song/SongAddToLikedButton.tsx";
import { SongPlayButton } from "@/components/song/SongPlayButton";
import { ISong } from "@/components/song/types";
import { useQueueAddAPI } from "@/hooks/useQueueAPI";
import { BetweenHorizonalStart } from "lucide-react";

interface SongCardProps {
    song: ISong;
    buttonSize?: number;
    buttonClass?: string;
    titleMaxWidth?: string;
    showImage?: boolean;
    showAddToQueueButton?: boolean;
}

export function SongCard({
    song,
    buttonSize = 20,
    buttonClass = "p-2",
    titleMaxWidth = "max-w-[200px]",
    showImage = true,
    showAddToQueueButton = true,
}: SongCardProps) {
    const addToQueueMutation = useQueueAddAPI();
    return (
        <div className="flex items-center justify-between w-full h-full">
            <div className="flex items-center gap-3">
                {showImage &&
                    (song.image ? (
                        <img
                            src={song.image}
                            alt={song.title}
                            className="w-10 h-10 object-cover rounded-sm border border-black"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-gray-200 flex items-center justify-center rounded-sm border border-black">
                            <span className="text-gray-400 text-xl">♪</span>
                        </div>
                    ))}

                <div className="flex flex-col">
                    <p className={`font-bold text-sm text-black truncate ${titleMaxWidth}`}>{song.title}</p>
                    <p className={`text-xs text-gray-600 truncate ${titleMaxWidth}`}>{song.artist}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <SongPlayButton song={song} size={buttonSize} className={buttonClass} />
                <SongAddToLikedButton song={song} size={buttonSize} className={buttonClass} />
                {showAddToQueueButton && (
                    <button
                        onClick={() => addToQueueMutation.mutate({ type: "song", item: song, action: "add" })}
                        disabled={addToQueueMutation.isPending}
                        className={`hover:bg-gray-200 rounded-full transition-colors ${buttonClass}`}
                    >
                        <BetweenHorizonalStart size={buttonSize} />
                    </button>
                )}
            </div>
        </div>
    );
}
