import type { ISong } from "@/features/songs/types.ts";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";

interface SongDisplayProps {
    song: ISong | undefined;
}

export function SongDisplay({ song }: SongDisplayProps) {
    if (!song) {
        return (
            <div className="text-center p-4 bg-gray-100 border border-gray-300 rounded-sm mb-4">
                <p className="text-gray-500">No song playing</p>
            </div>
        );
    }

    const mediaBaseClass =
        "bg-gray-200 flex items-center justify-center rounded-sm border border-black overflow-hidden";

    return (
        <div className="flex flex-col items-start gap-3 mb-4">
            <div className="w-full aspect-square max-w-2/5">
                {song.image ? (
                    <div className={`w-full h-full ${mediaBaseClass}`}>
                        <img
                            src={song.image}
                            alt={song.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className={`w-full h-full ${mediaBaseClass}`}>
                        <span className="text-gray-400 text-3xl">♪</span>
                    </div>
                )}
            </div>
            <div className="w-full text-start">
                <div className="flex flex-wrap gap-2 items-center mb-1">
                    {song.authors.map((author) => (
                        <UserIdentifier key={author.uuid} user={author} />
                    ))}
                </div>
                <p className="text-xl font-bold truncate">{song.title}</p>
            </div>
        </div>
    );
}
