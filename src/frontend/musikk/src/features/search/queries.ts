import { api_client } from "@/api/axiosConf.ts";
import { SearchURLs } from "@/api/endpoints.ts";
import { Collection, CollectionSong } from "@/features/song-collections/types.ts";
import { IUser } from "@/features/user/types.ts";

interface PerformSearchResponse {
    songs: CollectionSong[];
    playlists: Collection[];
    albums: Collection[];
    users: IUser[];
    artists: IUser[];
}

export async function performSearch(query: string): Promise<PerformSearchResponse> {
    const res = await api_client.get(SearchURLs.searchMain(query));
    return res.data;
}
