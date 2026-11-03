import { api_client } from "@/api/axiosConf.ts";
import { ApiSchemas, PaginatedRes, UUID } from "@/api/types.ts";
import { CollectionURLs } from "@/features/collections/api/endpoints.ts";
import { collectionKeys } from "@/features/collections/api/queryKeys.ts";
import {
    Collection,
    CollectionDetailed,
    CollectionListParams,
    CollectionType,
} from "@/features/collections/types.ts";
import { useQuery } from "@tanstack/react-query";

async function fetchCollections(params?: CollectionListParams): Promise<PaginatedRes<Collection>> {
    const res = await api_client.get<PaginatedRes<Collection>>(CollectionURLs.collectionList, {
        params,
    });
    return res.data;
}

const LATEST_COLLECTIONS_STALE_TIME_MS = 30_000;

function collectionResults(data: PaginatedRes<Collection>): Collection[] {
    return data.results;
}

export function useLatestCollections(params: CollectionListParams) {
    return useQuery({
        queryKey: collectionKeys.latest(params),
        queryFn: () => fetchCollections(params),
        select: collectionResults,
        staleTime: LATEST_COLLECTIONS_STALE_TIME_MS,
    });
}

export function useCollectionsByAuthorQuery(authorUUID: UUID, type: CollectionType) {
    return useQuery({
        queryKey: collectionKeys.byAuthor(authorUUID, type),
        queryFn: () => fetchCollections({ author: authorUUID, type }),
    });
}

export async function fetchUserLibrary(userUUID: UUID): Promise<ApiSchemas["UserLibrary"]> {
    const response = await api_client.get<ApiSchemas["UserLibrary"]>(
        CollectionURLs.userLibrary(userUUID),
    );
    return response.data;
}

async function fetchCollectionDetailed(collectionUUID: string): Promise<CollectionDetailed> {
    const response = await api_client.get<CollectionDetailed>(
        CollectionURLs.collectionDetail(collectionUUID),
    );
    return response.data;
}

export function useCollectionDetailQuery(collectionUUID: UUID) {
    return useQuery({
        queryKey: collectionKeys.detail(collectionUUID),
        queryFn: () => fetchCollectionDetailed(collectionUUID),
    });
}
