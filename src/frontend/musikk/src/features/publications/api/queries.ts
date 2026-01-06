import { api_client } from "@/api/axiosConf.ts";
import { PublicationURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { Publication, PublicationForType } from "@/features/publications/types.ts";
import { useQuery } from "@tanstack/react-query";

export async function fetchPublicationList(
    objType: PublicationForType,
    objUUID: UUID,
): Promise<Publication[]> {
    const res = await api_client.get(PublicationURLs.publicationList(objType, objUUID));
    return res.data;
}

export function usePublicationListQuery(objType: PublicationForType, objUUID: UUID) {
    return useQuery<Publication[]>({
        queryFn: () => fetchPublicationList(objType, objUUID),
        queryKey: ["publications", objType, objUUID],
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
