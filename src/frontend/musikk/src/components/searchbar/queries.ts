import { ISongCollection, ISongCollectionSong } from "@/components/song-collections/types.ts";
import { IUser } from "@/components/user/types.ts";
import { api } from "@/config/axiosConf.ts";
import { SearchURLs } from "@/config/endpoints.ts";

interface PerformSearchResponse {
    songs: ISongCollectionSong[];
    collections: ISongCollection[];
    users: IUser[];
    artists: IUser[];
}

export async function performSearch(query: string): Promise<PerformSearchResponse> {
    const res = await api.get(SearchURLs.searchMain(query));
    return res.data;
}
