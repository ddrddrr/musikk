import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import type { Song } from "@/features/songs/types.ts";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";

type SongDisplayProps = {
    song: Song | undefined;
};

export function SongDisplay({ song }: SongDisplayProps) {
    if (!song) {
        return (
            <div className="mb-4 rounded-sm border border-border bg-muted p-4 text-center">
                <p className="text-muted-foreground">No song playing</p>
            </div>
        );
    }

    return (
        <div className="mb-4 flex flex-col items-start gap-3">
            <div className="aspect-square w-full max-w-2/5">
                <MediaThumbnail
                    src={song.image}
                    alt={song.title}
                    className="h-full w-full"
                />
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
