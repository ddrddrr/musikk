import {ISong} from "@/components/song/types.ts";
import {SongURLs} from "@/config/endpoints.ts";
import { api } from "@/config/axiosConf.ts";

export async function fetchSongList(): Promise<ISong[]> {
    return await api.get(SongURLs.songList);
}