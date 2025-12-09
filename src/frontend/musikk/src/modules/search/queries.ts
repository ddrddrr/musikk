import { api_client } from "@/api/axiosConf.ts";
import { SearchURLs } from "@/api/endpoints.ts";
import { ICollection, ICollectionSong } from "@/modules/song-collections/types.ts";
import { IUser } from "@/modules/user/types.ts";

interface PerformSearchResponse {
    songs: ICollectionSong[];
    playlists: ICollection[];
    albums: ICollection[];
    users: IUser[];
    artists: IUser[];
}

export async function performSearch(query: string): Promise<PerformSearchResponse> {
    const res = await api_client.get(SearchURLs.searchMain(query));
    return res.data;
}
