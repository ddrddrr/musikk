import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { collectionAddToLiked } from "./mutations";
import { ISongCollection } from "./types";

interface CollectionAddToLikedButtonProps {
    collection: ISongCollection;
    showComments: boolean;
}

export function CollectionAddToLikedButton({ collection, showComments }: CollectionAddToLikedButtonProps) {
    const collectionAddToLikedMutation = useMutation({ mutationFn: collectionAddToLiked });
    const sizeClass = showComments ? "h-8 w-8" : "h-12 w-12";

    const renderAddIcon = () => {
        return collection.is_liked ? <Check size={20} /> : <Plus size={20} />;
    };

    function handleClick(collection: ISongCollection) {
        if (collection.is_liked) {
            return; // remove from liked
        }
        collectionAddToLikedMutation.mutate({ collectionUUID: collection.uuid });
    }

    return (
        <Button
            onClick={() => handleClick(collection)}
            className={`
        bg-gray-200 hover:bg-gray-300 text-black
        border-2 border-black rounded-lg
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        p-0 flex items-center justify-center
        ${sizeClass}
      `}
        >
            {renderAddIcon()}
        </Button>
    );
}
