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

export interface CollectionMembership {
    collection_uuid: UUID;
    collection_song_uuid: UUID;
}

interface CollectionMembershipResponse {
    collections: CollectionMembership[];
}

export async function collectionMemberships(
    collectionSongUUID: UUID,
): Promise<CollectionMembership[]> {
    const res = await api_client.get<CollectionMembershipResponse>(
        SongURLs.collectionMemberships(collectionSongUUID),
    );
    return res.data.collections;
}

export function useCollectionMemberships(collectionSongUUID: UUID) {
    return useQuery({
        queryKey: songKeys.userCollections(collectionSongUUID),
        queryFn: () => collectionMemberships(collectionSongUUID),
    });
}
