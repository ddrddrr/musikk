import { ISongCollection } from "@/components/song-collection/types.ts";
import { ISong } from "@/components/song/types.ts";
import { IUser } from "@/components/user/types.ts";
import { api } from "@/config/axiosConf.ts";
import { SearchURLs } from "@/config/endpoints.ts";

interface PerformSearchResponse {
    songs: ISong[];
    collections: ISongCollection[];
    users: IUser[];
}

export async function performSearch(query: string): Promise<PerformSearchResponse> {
    const res = await api.get(SearchURLs.searchMain(query));
    return res.data;
}
