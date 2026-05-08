import { CollectionCard } from "@/features/collections/components/CollectionCard.tsx";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { Attachment } from "@/features/publications/types.ts";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { UserCard } from "@/features/user/components/UserCard.tsx";
import { BaseUser } from "@/features/user/types.ts";

type PostAttachmentProps = {
    attachment: Attachment | null;
    size?: "compact" | "normal";
};

export function PostAttachment({ attachment, size = "normal" }: PostAttachmentProps) {
    if (!attachment) return null;

    switch (attachment.type) {
        case "collection":
            return <CollectionCard collection={attachment.obj as Collection} size="small" />;
        case "song":
            return (
                <SongContainer
                    collectionSong={attachment.obj as CollectionSong}
                    size={size}
                    showImage={size !== "compact"}
                />
            );
        case "user":
            return <UserCard user={attachment.obj as BaseUser} size="small" />;
        default:
            return null;
    }
}
