import { api_client } from "@/api/axiosConf.ts";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { SearchURLs } from "@/features/search/api/endpoints.ts";
import { BaseUser } from "@/features/user/types.ts";

interface PerformSearchResponse {
    songs: CollectionSong[];
    playlists: Collection[];
    albums: Collection[];
    users: BaseUser[];
    artists: BaseUser[];
}

export async function performSearch(query: string): Promise<PerformSearchResponse> {
    const res = await api_client.get<PerformSearchResponse>(SearchURLs.searchMain, {
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
