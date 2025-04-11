import axios from 'axios';

import {ISong} from "@/components/song/types.ts";
import {SongURLs} from "@/config/endpoints.ts";

export async function fetchSongList(): Promise<ISong[]> {
    return await axios.get(SongURLs.songList);
}