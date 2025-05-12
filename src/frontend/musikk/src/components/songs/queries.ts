import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { api } from "@/config/axiosConf.ts";
import { SongURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";

export async function songRetrieve(songUUID: UUID): Promise<ISongCollectionSong> {
    const res = await api.get(SongURLs.songRetrieve(songUUID));
    return res.data;
}
