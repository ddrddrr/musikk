import type { ISong } from "@/components/song/types.ts";

interface SongDisplayProps {
    song: ISong | null;
}

export function SongDisplay({ song }: SongDisplayProps) {
    if (!song) {
        return (
            <div className="text-center p-4 bg-gray-100 border border-gray-300 rounded-md mb-4">
                <p className="text-gray-500">No song playing</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3 mb-4">
            <div className="w-full aspect-square max-w-[150px] mx-auto">
                {song.image ? (
                    <img
                        src={song.image}
                        alt={song.title}
                        className="w-full h-full object-cover border border-black rounded-md"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center border border-black rounded-md">
                        <span className="text-gray-400 text-3xl">♪</span>
                    </div>
                )}
            </div>
            <div className="w-full text-center">
                <p className="font-bold truncate">{song.title}</p>
                <p className="text-sm text-gray-600 truncate">{song.artist}</p>
            </div>
        </div>
    );
}
