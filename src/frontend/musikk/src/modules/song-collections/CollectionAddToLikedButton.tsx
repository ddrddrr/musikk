import { Button } from "@/modules/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { collectionAddToLiked } from "./mutations";
import { ICollection } from "./types";

interface CollectionAddToLikedButtonProps {
    collection: ICollection;
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

    function handleClick(collection: ICollection) {
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
            className={`p-0 flex items-center justify-center ${sizeClass}`}
        >
            {renderAddIcon()}
        </Button>
    );
}
