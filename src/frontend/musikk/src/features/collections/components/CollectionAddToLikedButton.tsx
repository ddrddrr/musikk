import { useLikeCollection, useUnlikeCollection } from "@/features/collections/api/mutations.ts";
import { Collection } from "@/features/collections/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { useIsCollectionLiked } from "@/features/user/hooks/useUserLikes.ts";
import { Check, Plus } from "lucide-react";

interface CollectionAddToLikedButtonProps {
    collection: Collection;
    showComments: boolean;
}

export function CollectionAddToLikedButton({
    collection,
    showComments,
}: CollectionAddToLikedButtonProps) {
    const isLiked = useIsCollectionLiked(collection.uuid);
    const likeCollectionMutation = useLikeCollection();
    const unlikeCollectionMutation = useUnlikeCollection();
    const sizeClass = showComments ? "size-8" : "size-12";

    function handleClick(collection: Collection) {
        if (isLiked) {
            unlikeCollectionMutation.mutate({ collectionUUID: collection.uuid });
            return;
        }
        likeCollectionMutation.mutate({ collectionUUID: collection.uuid });
    }

    return (
        <IconTooltip label={isLiked ? "Liked" : "Like"}>
            <Button
                variant={isLiked ? "brand" : "muted"}
                size="icon"
                aria-label={isLiked ? "Liked" : "Like"}
                onClick={() => handleClick(collection)}
                className={sizeClass}
            >
                {isLiked ? <Check size={20} /> : <Plus size={20} />}
            </Button>
        </IconTooltip>
    );
}
