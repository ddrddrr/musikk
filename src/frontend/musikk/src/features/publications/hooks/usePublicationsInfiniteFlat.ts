import { UUID } from "@/api/types.ts";
import { usePublicationListInfiniteQuery } from "@/features/publications/api/queries.ts";
import { PublicationForType } from "@/features/publications/types.ts";
import { useMemo } from "react";

export function usePublicationsInfiniteFlat(
    objType: PublicationForType,
    objUUID: UUID,
    reverse = true,
) {
    const query = usePublicationListInfiniteQuery(objType, objUUID);

    // BE returns newest first; optionally reverse for oldest-first UI
    const publicationsFlat = useMemo(() => {
        const flat = query.data?.pages.flatMap((p) => p.results) ?? [];
        return reverse ? flat.slice().reverse() : flat;
    }, [query.data, reverse]);

    return { ...query, publicationsFlat };
}
