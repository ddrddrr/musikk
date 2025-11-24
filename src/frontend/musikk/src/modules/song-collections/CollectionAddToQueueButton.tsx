import { ISongCollectionDetailed } from "@/modules/song-collections/types.ts";
import { Button } from "@/modules/ui/button.tsx";
import { useQueueAddAPI } from "@/modules/song-queue/hooks/useQueueAPI.ts";
import { BetweenHorizonalStart } from "lucide-react";
import { memo } from "react";

interface CollectionAddToQueueButtonProps {
    collection: ISongCollectionDetailed;
    showComments: boolean;
}

export const CollectionAddToQueueButton = memo(function CollectionAddToQueueButton({
    collection,
    showComments,
}: CollectionAddToQueueButtonProps) {
    const addToQueueMutation = useQueueAddAPI();

    return (
        <Button
            variant="muted"
            size="icon"
            onClick={() =>
                addToQueueMutation.mutate({
                    type: "collection",
                    item: collection,
                    action: "add",
                })
            }
            disabled={addToQueueMutation.isPending}
            className={`p-0 flex items-center justify-center ${showComments ? "h-8 w-8" : "h-12 w-12"}`}
        >
            <BetweenHorizonalStart size={20} />
        </Button>
    );
});
