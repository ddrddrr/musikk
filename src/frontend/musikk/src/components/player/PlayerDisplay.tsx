

import type { ISong } from "@/components/song/types";

interface PlayerDisplayProps {
    song: ISong | null;
    currentTime?: number;
}

export function PlayerDisplay({ song, currentTime }: PlayerDisplayProps) {
    const formatDuration = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const displayImage = song?.image;
    const displayTitle = song?.title || "null";
    const displayArtist = song?.artist || "null";
    const displayDuration = song?.duration ?? 0;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 flex-shrink-0">
                {displayImage ? (
                    <img
                        src={displayImage}
                        alt={displayTitle}
                        className="w-full h-full object-cover border-2 border-black"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center border-2 border-black">
                        <span className="text-gray-400 text-3xl">♪</span>
                    </div>
                )}
            </div>
            <div className="w-full space-y-2">
                <div className="bg-gray-200 p-2 border-2 border-black">
                    <p className="font-bold text-center">{displayTitle}</p>
                </div>
                <div className="bg-gray-200 p-2 border-2 border-black">
                    <p className="text-sm text-center">{displayArtist}</p>
                </div>
                <div className="bg-gray-200 p-2 border-2 border-black">
                    <p className="text-sm text-center">
                        {`${formatDuration(currentTime ?? 0)} / ${formatDuration(displayDuration)}`}
                    </p>
                </div>
            </div>
        </div>
    );
}
