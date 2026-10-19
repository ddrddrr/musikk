import { CollectionSong } from "@/features/collections/types.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { StretchedLink } from "@/features/common/StretchedLink.tsx";
import { SongContextMenu } from "@/features/songs/components/SongContextMenu.tsx";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";

export function SongAttachmentRow({ song }: { song: CollectionSong }) {
    return (
        <SongContextMenu song={song}>
            <div className="relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                <MediaThumbnail src={song.song.image} className="size-8 shrink-0 rounded-sm" />
                <div className="flex min-w-0 flex-col">
                    <p className="truncate text-xs font-bold text-foreground">
                        <StretchedLink to={`/collection/${song.collection}/`}>
                            {song.song.title}
                        </StretchedLink>
                    </p>
                    <AuthorLinks
                        authors={song.song.authors}
                        className="text-[10px] text-muted-foreground"
                    />
                </div>
            </div>
        </SongContextMenu>
    );
}
