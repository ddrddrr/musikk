import { api_client } from "@/api/axiosConf.ts";
import { SearchURLs } from "@/api/endpoints.ts";
import { Collection, CollectionSong } from "@/features/song-collections/types.ts";
import { BaseUser } from "@/features/user/types.ts";

interface PerformSearchResponse {
    songs: CollectionSong[];
    playlists: Collection[];
    albums: Collection[];
    users: BaseUser[];
    artists: BaseUser[];
}

export async function performSearch(query: string): Promise<PerformSearchResponse> {
    const res = await api_client.get(SearchURLs.searchMain(query));
    const data = res.data;

    return {
        songs: data.songs.map((song: CollectionSong) => ({ ...song, kind: "collectionSong" as const })),
        playlists: data.playlists.map((playlist: Collection) => ({ ...playlist, kind: "collection" as const })),
        albums: data.albums.map((album: Collection) => ({ ...album, kind: "collection" as const })),
        users: data.users.map((user: BaseUser) => ({ ...user, kind: "user" as const })),
        artists: data.artists.map((artist: BaseUser) => ({ ...artist, kind: "user" as const })),
    };
}
