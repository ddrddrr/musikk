import { api } from "@/api/axiosConf.ts";
import { SearchURLs } from "@/api/endpoints.ts";
import { ISongCollection, ISongCollectionSong } from "@/components/song-collections/types.ts";
import { IUser } from "@/components/user/types.ts";

interface PerformSearchResponse {
    songs: ISongCollectionSong[];
    playlists: ISongCollection[];
    albums: ISongCollection[];
    users: IUser[];
    artists: IUser[];
}

export async function performSearch(query: string): Promise<PerformSearchResponse> {
    const res = await api.get(SearchURLs.searchMain(query));
    return res.data;
}
