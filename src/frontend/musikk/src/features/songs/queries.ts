import { api_client } from "@/api/axiosConf.ts";
import { SongURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { songKeys } from "@/features/songs/queryKeys.ts";
import { useQuery } from "@tanstack/react-query";

export async function songRetrieve(songUUID: UUID): Promise<CollectionSong> {
    const res = await api_client.get(SongURLs.songRetrieve(songUUID));
    return res.data;
}

export async function albumBySongRetrieve(songUUID: UUID): Promise<Collection> {
    const res = await api_client.get(SongURLs.albumBySong(songUUID));
    return res.data;
}

interface SongUserCollectionsResponse {
    collection_uuids: UUID[];
}

export async function songUserCollections(collectionSongUUID: UUID): Promise<UUID[]> {
    const res = await api_client.get<SongUserCollectionsResponse>(
        SongURLs.songUserCollections(collectionSongUUID),
    );
    return res.data.collection_uuids;
}

export function useSongUserCollectionsQuery(collectionSongUUID: UUID) {
    return useQuery({
        queryKey: songKeys.userCollections(collectionSongUUID),
        queryFn: () => songUserCollections(collectionSongUUID),
    });
}
