import { getErrorDetail } from "@/api/errorUtils.ts";
import { CollectionDetailed } from "@/features/collections/types.ts";
import { useQueueAddAPI } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { Button } from "@/features/ui/button.tsx";
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
    const addToQueueMutation = useQueueAddAPI();

    return (
        <Button
            variant="muted"
            size="icon"
            onClick={() =>
                addToQueueMutation.mutate(
                    {
                        type: "collection",
                        item: collection,
                        action: "add",
                    },
                    // TODO: move to mutation def?
                    {
                        onError: (error) => {
                            toast.error(getErrorDetail(error, "Failed to add to queue"));
                        },
                    },
                )
            }
            disabled={addToQueueMutation.isPending}
            className={showComments ? "h-8 w-8" : "h-12 w-12"}
        >
            <BetweenHorizonalStart size={20} />
        </Button>
    );
});
