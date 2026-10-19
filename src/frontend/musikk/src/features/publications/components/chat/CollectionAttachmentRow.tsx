import { CollectionContextMenu } from "@/features/collections/components/CollectionContextMenu.tsx";
import { Collection } from "@/features/collections/types.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { StretchedLink } from "@/features/common/StretchedLink.tsx";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";

export function CollectionAttachmentRow({ collection }: { collection: Collection }) {
    return (
        <CollectionContextMenu collection={collection}>
            <div className="relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                <MediaThumbnail src={collection.image} className="size-8 shrink-0 rounded-sm" />
                <div className="flex min-w-0 flex-col">
                    <p className="truncate text-xs font-bold text-foreground">
                        <StretchedLink to={`/collection/${collection.uuid}/`}>
                            {collection.title}
                        </StretchedLink>
                    </p>
                    <AuthorLinks
                        authors={collection.authors}
                        className="text-[10px] text-muted-foreground"
                    />
                </div>
            </div>
        </CollectionContextMenu>
    );
}
