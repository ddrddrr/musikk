import { Button } from "@/features/ui/button.tsx";
import { useMutation } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { collectionAddToLiked } from "../api/mutations.ts";
import { Collection } from "../types.ts";

interface CollectionAddToLikedButtonProps {
    collection: Collection;
    showComments: boolean;
}

export function CollectionAddToLikedButton({
    collection,
    showComments,
}: CollectionAddToLikedButtonProps) {
    const collectionAddToLikedMutation = useMutation({ mutationFn: collectionAddToLiked });
    const sizeClass = showComments ? "h-8 w-8" : "h-12 w-12";

    const renderAddIcon = () => {
        return collection.is_liked ? <Check size={20} /> : <Plus size={20} />;
    };

    function handleClick(collection: Collection) {
        if (collection.is_liked) {
            return; // remove from liked
        }
        collectionAddToLikedMutation.mutate({ collectionUUID: collection.uuid });
    }

    return (
        <Button
            variant={collection.is_liked ? "brand" : "muted"}
            size="icon"
            onClick={() => handleClick(collection)}
            className={sizeClass}
        >
            {renderAddIcon()}
        </Button>
    );
}
