import type { ISong } from "@/modules/songs/types.ts";
import { UserIdentifier } from "@/modules/user/UserIdentifier.tsx";
import { MediaBox } from "@/modules/ui/media";

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

    return (
        <div className="flex flex-col items-start gap-3 mb-4">
            <div className="w-full aspect-square max-w-2/5">
                {song.image ? (
                    <MediaBox className="w-full h-full" asChild>
                        <img src={song.image} alt={song.title} className="w-full h-full object-cover" />
                    </MediaBox>
                ) : (
                    <MediaBox className="w-full h-full">
                        <span className="text-gray-400 text-3xl">♪</span>
                    </MediaBox>
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
