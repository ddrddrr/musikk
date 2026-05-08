import { api_client } from "@/api/axiosConf.ts";
import { QueueURLs } from "@/api/endpoints.ts";
import { SongQueue } from "@/features/song-queue/api/types.ts";

export async function getSongQueue(): Promise<SongQueue> {
    return (await api_client.get(QueueURLs.queue)).data;
}
