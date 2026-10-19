import { useQueueSkipTo } from "@/features/song-queue/api/mutations.ts";
import { QueueItem } from "@/features/song-queue/types.ts";

export function useQueuePlayHandler(item: QueueItem) {
    const skipToMutation = useQueueSkipTo();

    const onClick = () => skipToMutation.mutate(item.uuid);

    return { onClick };
}
