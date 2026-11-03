import { api_client } from "@/api/axiosConf.ts";
import { ApiSchemas, UUID } from "@/api/types.ts";
import { UserURLs } from "@/features/user/api/endpoints.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { useQuery } from "@tanstack/react-query";

async function fetchLikedSongUUIDs(): Promise<Set<UUID>> {
    const res = await api_client.get<ApiSchemas["MeLikedSongs"]>(UserURLs.meLikedSongs);
    return new Set(res.data.song_uuids);
}

async function fetchLikedCollectionUUIDs(): Promise<Set<UUID>> {
    const res = await api_client.get<ApiSchemas["MeLikedCollections"]>(UserURLs.meLikedCollections);
    return new Set(res.data.collection_uuids);
}

function useLikedSongUUIDs() {
    return useQuery({
        queryKey: userKeys.likedSongs(),
        queryFn: fetchLikedSongUUIDs,
    });
}

function useLikedCollectionUUIDs() {
    return useQuery({
        queryKey: userKeys.likedCollections(),
        queryFn: fetchLikedCollectionUUIDs,
    });
}

export function useIsSongLiked(songUUID: UUID): boolean {
    const { data } = useLikedSongUUIDs();
    return data?.has(songUUID) ?? false;
}

export function useIsCollectionLiked(collectionUUID: UUID): boolean {
    const { data } = useLikedCollectionUUIDs();
    return data?.has(collectionUUID) ?? false;
}
