import { api_client } from "@/api/axiosConf.ts";
import { PaginatedRes, UUID } from "@/api/types.ts";
import { CollectionURLs } from "@/features/collections/api/endpoints.ts";
import { collectionKeys } from "@/features/collections/api/queryKeys.ts";
import { Collection, CollectionDetailed, CollectionType } from "@/features/collections/types.ts";
import { ConnectionType } from "@/features/user/types.ts";
import { useQuery } from "@tanstack/react-query";

export interface CollectionListParams {
    type?: CollectionType;
    connection?: ConnectionType;
    author?: string;
    limit?: number;
    offset?: number;
}

export async function fetchCollections(
    params?: CollectionListParams,
): Promise<PaginatedRes<Collection>> {
    const res = await api_client.get<PaginatedRes<Collection>>(CollectionURLs.collectionList, {
        params,
    });
    return res.data;
}

interface FetchCollectionsPersonalParams {
    history: Collection;
    liked_songs: Collection;
    created_collections: Collection[];
    followed_collections: Collection[];
}

export async function fetchCollectionsPersonal(
    userUUID: UUID,
): Promise<FetchCollectionsPersonalParams> {
    const response = await api_client.get(CollectionURLs.collectionPersonal(userUUID));
    return response.data;
}

export async function fetchCollectionDetailed(collectionUUID: string): Promise<CollectionDetailed> {
    const response = await api_client.get(CollectionURLs.collectionDetail(collectionUUID));
    return response.data;
}

export async function fetchCollectionBasic(collectionUUID: UUID) {
    const res = await api_client.get(CollectionURLs.collectionRetrieve(collectionUUID));
    return res.data;
}

export function useCollectionDetailQuery(collectionUUID: UUID) {
    return useQuery({
        queryKey: collectionKeys.detail(collectionUUID),
        queryFn: () => fetchCollectionDetailed(collectionUUID),
    });
}
