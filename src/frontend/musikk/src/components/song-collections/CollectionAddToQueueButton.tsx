import { ISongCollectionDetailed } from "@/components/song-collections/types.ts";
import { Button } from "@/components/ui/button.tsx";
import { useQueueAddAPI } from "@/hooks/useQueueAPI.ts";
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
            onClick={() =>
                addToQueueMutation.mutate({
                    type: "collection",
                    item: collection,
                    action: "add",
                })
            }
            disabled={addToQueueMutation.isPending}
            className={`bg-gray-200 hover:bg-gray-300 
            text-black border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
             p-0 flex items-center justify-center ${showComments ? "h-8 w-8" : "h-12 w-12"}`}
        >
            <BetweenHorizonalStart size={20} />
        </Button>
    );
});
