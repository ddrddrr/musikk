import { ISong } from "@/components/songs/types.ts";
import { api } from "@/config/axiosConf.ts";
import { SongURLs } from "@/config/endpoints.ts";

export async function fetchSongList(): Promise<ISong[]> {
    const res = await api.get(SongURLs.songList);
    return res.data;
}
