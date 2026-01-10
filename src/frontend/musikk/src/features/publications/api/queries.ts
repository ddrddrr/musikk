import { api_client } from "@/api/axiosConf.ts";
import { PublicationURLs } from "@/api/endpoints.ts";
import { PaginatedRes, UUID } from "@/api/types.ts";
import { Publication, PublicationForType } from "@/features/publications/types.ts";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export async function fetchPublicationListPage(
    objType: PublicationForType,
    objUUID: UUID,
    limit = 10,
    offset = 0,
) {
    const res = await api_client.get(PublicationURLs.publicationList(objType, objUUID), {
        params: { limit, offset },
    });
    return res.data as PaginatedRes<Publication>;
}

export function usePublicationListInfiniteQuery(objType: PublicationForType, objUUID: UUID) {
    const limit = 10;

    return useInfiniteQuery({
        queryKey: ["publications", objType, objUUID, "infinite", limit],
        initialPageParam: 0,
        queryFn: ({ pageParam }) => fetchPublicationListPage(objType, objUUID, limit, pageParam),
        getNextPageParam: (lastPage) => {
            if (!lastPage.next) return undefined;
            // drf returns a `next` field which contains the limit/offset
            const offsetStr = new URL(lastPage.next).searchParams.get("offset");
            return offsetStr ? Number(offsetStr) : undefined;
        },
    });
}
export async function fetchPublicationDetail(pubUUID: UUID): Promise<Publication> {
    const res = await api_client.get(PublicationURLs.publicationsRetrieve(pubUUID));
    return res.data;
}

export function usePublicationDetailQuery(pubUUID: UUID) {
    return useQuery<Publication>({
        queryFn: () => fetchPublicationDetail(pubUUID),
        queryKey: ["publications", pubUUID],
    });
}
