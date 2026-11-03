import { api_client } from "@/api/axiosConf.ts";
import { ApiSchemas } from "@/api/types.ts";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { SearchURLs } from "@/features/search/api/endpoints.ts";
import { searchKeys } from "@/features/search/api/queryKeys.ts";
import { BaseUser } from "@/features/user/types.ts";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

interface SearchResults {
    songs: CollectionSong[];
    playlists: Collection[];
    albums: Collection[];
    users: BaseUser[];
    artists: BaseUser[];
}

async function performSearch(query: string): Promise<SearchResults> {
    const res = await api_client.get<ApiSchemas["SearchResults"]>(SearchURLs.searchMain, {
        params: { q: query },
    });
    const { songs, playlists, albums, users, artists } = res.data;

    return {
        songs: songs.map((song) => ({ ...song, kind: "collectionSong" as const })),
        playlists: playlists.map((playlist) => ({ ...playlist, kind: "collection" as const })),
        albums: albums.map((album) => ({ ...album, kind: "collection" as const })),
        users: users.map((user) => ({ ...user, kind: "user" as const })),
        artists: artists.map((artist) => ({ ...artist, kind: "user" as const })),
    };
}

export function useSearchResults(query: string) {
    return useQuery({
        queryKey: searchKeys.result(query),
        queryFn: () => performSearch(query),
        enabled: !!query.trim(),
        placeholderData: keepPreviousData,
    });
}
