import { api_client } from "@/api/axiosConf.ts";
import { PaginatedRes, UUID } from "@/api/types.ts";
import { PublicationURLs } from "@/features/publications/api/urls.ts";
import { Publication } from "@/features/publications/types.ts";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

async function fetchPublicationPage(
    url: string,
    limit = 10,
    offset = 0,
    additionalParams?: Record<string, string>,
): Promise<PaginatedRes<Publication>> {
    const res = await api_client.get<PaginatedRes<Publication>>(url, {
        params: { limit, offset, ...additionalParams },
    });
    return res.data;
}

function usePublicationListInfinite(
    url: string,
    queryKey: unknown[],
    additionalParams?: Record<string, string>,
) {
    const limit = 10;

    return useInfiniteQuery({
        queryKey: [...queryKey, url, "infinite", limit, additionalParams],
        initialPageParam: 0,
        queryFn: ({ pageParam }) => fetchPublicationPage(url, limit, pageParam, additionalParams),
        getNextPageParam: (lastPage) => {
            if (!lastPage.next) return undefined;
            const offsetStr = new URL(lastPage.next).searchParams.get("offset");
            return offsetStr ? Number(offsetStr) : undefined;
        },
    });
}

export function useFeedPosts(userUUID: UUID, connection?: "friends" | "followed") {
    const params = connection ? { connection } : undefined;
    return usePublicationListInfinite(
        PublicationURLs.feedPosts(userUUID),
        ["feed-posts", userUUID, connection],
        params,
    );
}

export function useCollectionComments(collectionUUID: UUID) {
    return usePublicationListInfinite(PublicationURLs.collectionComments(collectionUUID), [
        "collection-comments",
        collectionUUID,
    ]);
}

export async function fetchPublicationDetail(pubUUID: UUID): Promise<Publication> {
    const res = await api_client.get<Publication>(PublicationURLs.publicationRetrieve(pubUUID));
    return res.data;
}

export function usePublicationDetail(pubUUID: UUID) {
    return useQuery<Publication>({
        queryFn: () => fetchPublicationDetail(pubUUID),
        queryKey: ["publication", pubUUID],
    });
}

export async function fetchPublicationChildren(pubUUID: UUID): Promise<Publication[]> {
    const res = await api_client.get<{ children: Publication[] }>(
        PublicationURLs.publicationChildren(pubUUID),
    );
    return res.data.children;
}

export function usePublicationChildren(pubUUID: UUID, enabled = true) {
    return useQuery<Publication[]>({
        queryFn: () => fetchPublicationChildren(pubUUID),
        queryKey: ["publication-children", pubUUID],
        enabled,
    });
}
