import { SongPlayButton } from "@/components/song/SongPlayButton.tsx";
import { ISong } from "@/components/song/types.ts";
import { useQueueAddAPI } from "@/hooks/useQueueAPI.ts";
import { BetweenHorizonalStart } from "lucide-react";

interface SongCardProps {
    song: ISong;
}

export function SongCard({ song }: SongCardProps) {
    const addToQueueMutation = useQueueAddAPI();
    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <p className="font-medium text-sm text-gray-800 truncate max-w-[100px]">{song.title}</p>
                <p className="text-xs text-gray-600 truncate max-w-[160px]">{song.artist}</p>
            </div>

            <div className="flex items-center gap-1">
                <SongPlayButton song={song} />
                <button
                    onClick={() => addToQueueMutation.mutate({ type: "song", item: song, action: "add" })}
                    disabled={addToQueueMutation.isPending}
                    className="p-1 hover:bg-gray-200 rounded-full"
                >
                    <BetweenHorizonalStart size={16} />
                </button>
            </div>
        </div>
    );
}
