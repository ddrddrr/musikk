import { api_client } from "@/api/axiosConf.ts";
import { PublicationURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { IPublication, PublicationForType } from "@/modules/publications/types.ts";
import { useQuery } from "@tanstack/react-query";

export async function fetchPublicationList(
    objType: PublicationForType,
    objUUID: UUID,
    withChildren?: boolean,
): Promise<IPublication[]> {
    const res = await api_client.get(PublicationURLs.publicationList(objType, objUUID), {
        params: withChildren ? { with_children: "true" } : undefined,
    });
    return res.data;
}

export function usePublicationListQuery(
    objType: PublicationForType,
    objUUID: UUID,
    withChildren?: boolean,
) {
    return useQuery<IPublication[]>({
        queryFn: () => fetchPublicationList(objType, objUUID, withChildren),
        queryKey: ["publications", objType, objUUID, withChildren],
    });
}
