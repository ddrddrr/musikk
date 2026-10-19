import { useLikeCollection, useUnlikeCollection } from "@/features/collections/api/mutations.ts";
import { Collection } from "@/features/collections/types.ts";
import { LikeToggleButton } from "@/features/common/LikeToggleButton.tsx";
import { ActionButtonSize } from "@/features/common/types.ts";
import { useIsCollectionLiked } from "@/features/user/hooks/useUserLikes.ts";

interface CollectionAddToLikedButtonProps {
    collection: Collection;
    size: ActionButtonSize;
}

export function CollectionAddToLikedButton({ collection, size }: CollectionAddToLikedButtonProps) {
    const isLiked = useIsCollectionLiked(collection.uuid);
    const likeCollectionMutation = useLikeCollection();
    const unlikeCollectionMutation = useUnlikeCollection();
    const variables = { collectionUUID: collection.uuid };

    return (
        <LikeToggleButton
            isLiked={isLiked}
            size={size}
            onLike={() => likeCollectionMutation.mutate(variables)}
            onUnlike={() => unlikeCollectionMutation.mutate(variables)}
        />
    );
}
