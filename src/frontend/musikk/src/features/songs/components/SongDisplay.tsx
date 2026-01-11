import type { Song } from "@/features/songs/types.ts";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";

interface SongDisplayProps {
    song: Song | undefined;
}

export function SongDisplay({ song }: SongDisplayProps) {
    if (!song) {
        return (
            <div className="mb-4 rounded-sm border border-gray-300 bg-gray-100 p-4 text-center">
                <p className="text-gray-500">No song playing</p>
            </div>
        );
    }

    const mediaBaseClass =
        "bg-gray-200 flex items-center justify-center rounded-sm border border-black overflow-hidden";

    return (
        <div className="mb-4 flex flex-col items-start gap-3">
            <div className="aspect-square w-full max-w-2/5">
                {song.image ? (
                    <div className={`h-full w-full ${mediaBaseClass}`}>
                        <img
                            src={song.image}
                            alt={song.title}
                            className="h-full w-full object-cover"
                        />
                    </div>
                ) : (
                    <div className={`h-full w-full ${mediaBaseClass}`}>
                        <span className="text-3xl text-gray-400">♪</span>
                    </div>
                )}
            </div>
            <div className="w-full text-start">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                    {song.authors.map((author) => (
                        <UserIdentifier key={author.uuid} user={author} />
                    ))}
                </div>
                <p className="truncate text-xl font-bold">{song.title}</p>
            </div>
        </div>
    );
}
