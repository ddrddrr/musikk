import { CollectionCard } from "@/features/collections/components/CollectionCard.tsx";
import { Attachment } from "@/features/publications/types.ts";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { UserCard } from "@/features/user/components/UserCard.tsx";

type PostAttachmentProps = {
    attachment: Attachment | null;
    size?: "compact" | "normal";
};

export function PostAttachment({ attachment, size = "normal" }: PostAttachmentProps) {
    if (!attachment) return null;

    switch (attachment.type) {
        case "collection":
            return <CollectionCard collection={attachment.obj} size="small" />;
        case "song":
            return (
                <SongContainer
                    collectionSong={attachment.obj}
                    size={size}
                    showImage={size !== "compact"}
                />
            );
        case "user":
            return <UserCard user={attachment.obj} size="small" />;
    }
}
