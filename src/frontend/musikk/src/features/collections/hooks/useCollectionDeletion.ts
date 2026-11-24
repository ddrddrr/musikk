import { useDeleteCollection } from "@/features/collections/api/mutations.ts";
import { CollectionDetailed } from "@/features/collections/types.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useCollectionDeletion() {
    const navigate = useNavigate();
    const deleteCollectionMutation = useDeleteCollection();

    const deleteCollection = (collection: CollectionDetailed) => {
        const deletedMessage = collection.type === "album" ? "Album deleted" : "Playlist deleted";
        deleteCollectionMutation.mutate(
            { collectionUUID: collection.uuid },
            {
                onSuccess: () => {
                    toast.success(deletedMessage);
                    void navigate("/");
                },
            },
        );
    };

    return { deleteCollection, isDeleting: deleteCollectionMutation.isPending };
}
