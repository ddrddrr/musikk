import { UUID } from "@/api/types.ts";
import { usePublicationListInfiniteQuery } from "@/features/publications/api/queries.ts";
import { PublicationForType } from "@/features/publications/types.ts";
import { useMemo } from "react";

export function usePublicationsInfiniteFlat(objType: PublicationForType, objUUID: UUID) {
    const query = usePublicationListInfiniteQuery(objType, objUUID);

    // reverse since BE returns newest first
    const publicationsFlat = useMemo(() => {
        const flat = query.data?.pages.flatMap((p) => p.results) ?? [];
        return flat.slice().reverse();
    }, [query.data]);

    return { ...query, publicationsFlat };
}
