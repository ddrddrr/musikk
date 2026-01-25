import { api_client } from "@/api/axiosConf.ts";
import { SongURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { Collection, CollectionSong } from "@/features/collections/types.ts";

export async function songRetrieve(songUUID: UUID): Promise<CollectionSong> {
    const res = await api_client.get(SongURLs.songRetrieve(songUUID));
    return res.data;
}

export async function albumBySongRetrieve(songUUID: UUID): Promise<Collection> {
    const res = await api_client.get(SongURLs.albumBySong(songUUID));
    return res.data;
}
