import { Attachment } from "@/features/publications/types.ts";
import { CollectionCard } from "@/features/song-collections/components/CollectionCard.tsx";
import { Collection, CollectionSong } from "@/features/song-collections/types.ts";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";

type PostAttachmentProps = {
    attachment: Attachment | null;
};

export function PostAttachment({ attachment }: PostAttachmentProps) {
    // TODO add collection card variant where the image is on the left and text is on the right
    if (!attachment) return null;

    switch (attachment.type) {
        case "collection":
            return (
                <div className="mb-4">
                    {/*TODO: make border smaller? or just consolidate style somehow...*/}
                    <CollectionCard collection={attachment.obj as Collection} size="small" />
                </div>
            );
        case "song":
            return (
                <div className="mb-4">
                    <SongContainer
                        collectionSong={attachment.obj as CollectionSong}
                        extraStyle={"border"}
                    />
                </div>
            );
        default:
            return null;
    }
}
