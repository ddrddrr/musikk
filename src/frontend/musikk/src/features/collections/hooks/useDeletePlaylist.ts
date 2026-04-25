import { getErrorDetail } from "@/api/errorUtils.ts";
import { deleteCollection } from "@/features/collections/api/mutations.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useDeletePlaylist() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteCollection,
        onSuccess: () => {
            toast.success("Playlist deleted");
            void queryClient.invalidateQueries({ queryKey: ["collectionsPersonal"] });
            void queryClient.invalidateQueries({ queryKey: ["openCollection"] });
            void navigate("/");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to delete playlist"));
        },
    });
}
