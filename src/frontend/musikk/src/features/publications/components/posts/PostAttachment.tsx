import { CollectionCard } from "@/features/collections/components/CollectionCard.tsx";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { Attachment } from "@/features/publications/types.ts";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";

type PostAttachmentProps = {
    attachment: Attachment | null;
};

export function PostAttachment({ attachment }: PostAttachmentProps) {
    if (!attachment) return null;

    switch (attachment.type) {
        case "collection":
            return <CollectionCard collection={attachment.obj as Collection} size="small" />;
        case "song":
            return <SongContainer collectionSong={attachment.obj as CollectionSong} />;
        default:
            return null;
    }
}
