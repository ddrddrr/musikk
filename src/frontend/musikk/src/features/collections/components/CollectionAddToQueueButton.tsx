import { CollectionDetailed } from "@/features/collections/types.ts";
import { useAddCollection } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { Button } from "@/features/ui/button.tsx";
import { BetweenHorizonalStart } from "lucide-react";
import { memo } from "react";

interface CollectionAddToQueueButtonProps {
    collection: CollectionDetailed;
    showComments: boolean;
}

export const CollectionAddToQueueButton = memo(function CollectionAddToQueueButton({
    collection,
    showComments,
}: CollectionAddToQueueButtonProps) {
    const addCollectionMutation = useAddCollection();

    return (
        <Button
            variant="muted"
            size="icon"
            onClick={() => addCollectionMutation.mutate(collection.uuid)}
            disabled={addCollectionMutation.isPending}
            className={showComments ? "h-8 w-8" : "h-12 w-12"}
        >
            <BetweenHorizonalStart size={20} />
        </Button>
    );
});
