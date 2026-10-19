import { useLikeCollection, useUnlikeCollection } from "@/features/collections/api/mutations.ts";
import { Collection } from "@/features/collections/types.ts";
import { ActionButtonSize } from "@/features/common/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { useIsCollectionLiked } from "@/features/user/hooks/useUserLikes.ts";
import { Check, Plus } from "lucide-react";

interface CollectionAddToLikedButtonProps {
    collection: Collection;
    size: ActionButtonSize;
}

export function CollectionAddToLikedButton({ collection, size }: CollectionAddToLikedButtonProps) {
    const isLiked = useIsCollectionLiked(collection.uuid);
    const likeCollectionMutation = useLikeCollection();
    const unlikeCollectionMutation = useUnlikeCollection();

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
                size={`icon-${size}`}
                aria-label={isLiked ? "Liked" : "Like"}
                onClick={() => handleClick(collection)}
            >
                {isLiked ? <Check /> : <Plus />}
            </Button>
        </IconTooltip>
    );
}
