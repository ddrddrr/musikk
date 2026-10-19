import { CollectionDetailed } from "@/features/collections/types.ts";
import { ActionButtonSize } from "@/features/common/types.ts";
import { useAddCollection } from "@/features/song-queue/api/mutations.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip.tsx";
import { BetweenHorizonalStart } from "lucide-react";
import { toast } from "sonner";

interface CollectionAddToQueueButtonProps {
    collection: CollectionDetailed;
    size: ActionButtonSize;
}

export function CollectionAddToQueueButton({ collection, size }: CollectionAddToQueueButtonProps) {
    const addCollectionMutation = useAddCollection();

    return (
        <IconTooltip label="Queue">
            <Button
                variant="muted"
                size={`icon-${size}`}
                aria-label="Add to queue"
                onClick={() =>
                    addCollectionMutation.mutate(collection.uuid, {
                        onSuccess: () => toast.success("Added to queue"),
                    })
                }
                disabled={addCollectionMutation.isPending}
            >
                <BetweenHorizonalStart />
            </Button>
        </IconTooltip>
    );
}
