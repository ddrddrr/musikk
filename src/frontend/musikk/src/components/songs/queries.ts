import { api } from "@/api/axiosConf.ts";
import { SongURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { ISongCollection, ISongCollectionSong } from "@/components/song-collections/types.ts";

export async function songRetrieve(songUUID: UUID): Promise<ISongCollectionSong> {
    const res = await api.get(SongURLs.songRetrieve(songUUID));
    return res.data;
}

export async function albumBySongRetrieve(songUUID: UUID): Promise<ISongCollection> {
    const res = await api.get(SongURLs.albumBySong(songUUID));
    return res.data;
}
