import { CollectionDetailed } from "@/features/collections/types.ts";
import { useAddCollection } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { BetweenHorizonalStart } from "lucide-react";
import { memo } from "react";
import { toast } from "sonner";

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
        <IconTooltip label="Queue">
            <Button
                variant="muted"
                size="icon"
                aria-label="Add to queue"
                onClick={() =>
                    addCollectionMutation.mutate(collection.uuid, {
                        onSuccess: () => toast.success("Added to queue"),
                    })
                }
                disabled={addCollectionMutation.isPending}
                className={showComments ? "size-8" : "size-12"}
            >
                <BetweenHorizonalStart size={20} />
            </Button>
        </IconTooltip>
    );
});
