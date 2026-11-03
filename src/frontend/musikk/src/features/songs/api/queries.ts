import { api_client } from "@/api/axiosConf.ts";
import { ApiSchemas, UUID } from "@/api/types.ts";
import { Collection } from "@/features/collections/types.ts";
import { SongURLs } from "@/features/songs/api/endpoints.ts";
import { songKeys } from "@/features/songs/api/queryKeys.ts";
import { useQuery } from "@tanstack/react-query";

export async function albumBySongRetrieve(songUUID: UUID): Promise<Collection> {
    const res = await api_client.get<Collection>(SongURLs.albumBySong(songUUID));
    return res.data;
}

type CollectionMembership = ApiSchemas["SongCollectionLink"];

async function collectionMemberships(collectionSongUUID: UUID): Promise<CollectionMembership[]> {
    const res = await api_client.get<ApiSchemas["SongUserCollections"]>(
        SongURLs.collectionMemberships(collectionSongUUID),
    );
    return res.data.collections;
}

export function useCollectionMemberships(collectionSongUUID: UUID) {
    return useQuery({
        queryKey: songKeys.collectionMembership(collectionSongUUID),
        queryFn: () => collectionMemberships(collectionSongUUID),
    });
}
