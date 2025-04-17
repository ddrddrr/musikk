import { ISongQueue } from "@/components/song-queue/types.ts";
import { api } from "@/config/axiosConf.ts";
import { QueueURLs } from "@/config/endpoints.ts";

export async function getSongQueue(): Promise<ISongQueue> {
    return (await api.get(QueueURLs.queue)).data;
}
