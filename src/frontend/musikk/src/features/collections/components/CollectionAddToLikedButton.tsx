import { getErrorDetail } from "@/api/errorUtils.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { useIsCollectionLiked } from "@/features/user/hooks/useUserLikes.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { collectionAddToLiked, collectionRemoveFromLiked } from "../api/mutations.ts";
import { Collection } from "../types.ts";

interface CollectionAddToLikedButtonProps {
    collection: Collection;
    showComments: boolean;
}

export function CollectionAddToLikedButton({
    collection,
    showComments,
}: CollectionAddToLikedButtonProps) {
    const queryClient = useQueryClient();
    const isLiked = useIsCollectionLiked(collection.uuid);

    const invalidateLikedCollections = () =>
        queryClient.invalidateQueries({ queryKey: userKeys.likedCollections });

    const collectionAddToLikedMutation = useMutation({
        mutationFn: collectionAddToLiked,
        onSuccess: () => {
            void invalidateLikedCollections();
            toast.success("Added to liked collections");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to add collection to liked"));
        },
    });
    const collectionRemoveFromLikedMutation = useMutation({
        mutationFn: collectionRemoveFromLiked,
        onSuccess: () => {
            void invalidateLikedCollections();
            toast.success("Removed from liked collections");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to remove collection from liked"));
        },
    });
    const sizeClass = showComments ? "size-8" : "size-12";

    function handleClick(collection: Collection) {
        if (isLiked) {
            collectionRemoveFromLikedMutation.mutate({ collectionUUID: collection.uuid });
            return;
        }
        collectionAddToLikedMutation.mutate({ collectionUUID: collection.uuid });
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
