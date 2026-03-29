import { getErrorDetail } from "@/api/errorUtils.ts";
import { QueueItem } from "@/features/song-queue/api/types.ts";
import { skipTo } from "@/features/song-queue/mutations.ts";
import { queueKeys } from "@/features/song-queue/queryKeys.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCallback } from "react";

export function useQueuePlayHandler(item: QueueItem) {
    const queryClient = useQueryClient();

    const chooseMutation = useMutation({
        mutationFn: () => skipTo(item.uuid),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queueKeys.base });
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to play queue item"));
        },
    });

    const onClick = useCallback(() => {
        chooseMutation.mutate();
    }, [chooseMutation]);

    return { onClick };
}
