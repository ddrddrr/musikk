import { getErrorDetail } from "@/api/errorUtils.ts";
import { collectionRemoveSong } from "@/features/collections/api/mutations.ts";
import { collectionKeys } from "@/features/collections/api/queryKeys.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { useAddSong } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { useSongPlayHandler } from "@/features/songs/hooks/useSongPlayHandler.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useSongActions(collectionSong: CollectionSong) {
    const queryClient = useQueryClient();
    const removeSongMutation = useMutation({
        mutationFn: collectionRemoveSong,
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: collectionKeys.detail(variables.collectionUUID),
            });
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to remove song"));
        },
    });
    const { onClick: onPlay } = useSongPlayHandler(collectionSong);
    const addSongMutation = useAddSong();

    return { removeSongMutation, onPlay, addSongMutation };
}
