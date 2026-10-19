import { UUID } from "@/api/types.ts";
import { useDeleteCollection } from "@/features/collections/api/mutations.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useDeletePlaylist() {
    const navigate = useNavigate();
    const deleteCollectionMutation = useDeleteCollection();

    const deletePlaylist = (collectionUUID: UUID) => {
        deleteCollectionMutation.mutate(
            { collectionUUID },
            {
                onSuccess: () => {
                    toast.success("Playlist deleted");
                    void navigate("/");
                },
            },
        );
    };

    return { deletePlaylist, isDeleting: deleteCollectionMutation.isPending };
}
