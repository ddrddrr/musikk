import { api_client } from "@/api/axiosConf.ts";
import { QueueURLs } from "@/features/song-queue/api/endpoints.ts";
import { queueKeys } from "@/features/song-queue/api/queryKeys.ts";
import { SongQueue } from "@/features/song-queue/types.ts";
import { useQuery } from "@tanstack/react-query";

async function getSongQueue(): Promise<SongQueue> {
    return (await api_client.get(QueueURLs.queue)).data;
}

export function useQueue() {
    return useQuery<SongQueue>({
        queryKey: queueKeys.base,
        queryFn: getSongQueue,
    });
}
