import { api } from "@/api/axiosConf.ts";
import { QueueURLs } from "@/api/endpoints.ts";
import { ISongQueue } from "@/components/song-queue/types.ts";

export async function getSongQueue(): Promise<ISongQueue> {
    return (await api.get(QueueURLs.queue)).data;
}
