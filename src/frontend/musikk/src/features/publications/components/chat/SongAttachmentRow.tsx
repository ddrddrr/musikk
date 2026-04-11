import { CollectionSong } from "@/features/collections/types.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { SongContextMenu } from "@/features/songs/components/SongContextMenu.tsx";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";
import { useNavigate } from "react-router-dom";

export function SongAttachmentRow({ song }: { song: CollectionSong }) {
    const navigate = useNavigate();

    return (
        <SongContextMenu song={song}>
            <div
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted"
                onClick={() => void navigate(`/collection/${song.collection}/`)}
            >
                <MediaThumbnail src={song.song.image} className="size-8 shrink-0 rounded-sm" />
                <div className="flex min-w-0 flex-col">
                    <p className="truncate text-xs font-bold text-foreground">{song.song.title}</p>
                    <AuthorLinks authors={song.song.authors} className="text-[10px] text-muted-foreground" />
                </div>
            </div>
        </SongContextMenu>
    );
}
