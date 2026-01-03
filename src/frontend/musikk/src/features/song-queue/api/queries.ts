import { api_client } from "@/api/axiosConf.ts";
import { QueueURLs } from "@/api/endpoints.ts";
import { ISongQueue } from "@/features/song-queue/api/types.ts";

export async function getSongQueue(): Promise<ISongQueue> {
    return (await api_client.get(QueueURLs.queue)).data;
}
