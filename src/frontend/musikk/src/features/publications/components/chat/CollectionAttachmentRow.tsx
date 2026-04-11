import { CollectionContextMenu } from "@/features/collections/components/CollectionContextMenu.tsx";
import { Collection } from "@/features/collections/types.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";
import { useNavigate } from "react-router-dom";

export function CollectionAttachmentRow({ collection }: { collection: Collection }) {
    const navigate = useNavigate();

    return (
        <CollectionContextMenu collection={collection}>
            <div
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted"
                onClick={() => void navigate(`/collection/${collection.uuid}/`)}
            >
                <MediaThumbnail src={collection.image} className="size-8 shrink-0 rounded-sm" />
                <div className="flex min-w-0 flex-col">
                    <p className="truncate text-xs font-bold text-foreground">{collection.title}</p>
                    <AuthorLinks authors={collection.authors} className="text-[10px] text-muted-foreground" />
                </div>
            </div>
        </CollectionContextMenu>
    );
}
