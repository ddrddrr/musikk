import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import { PaginatedRes } from "./types";

export function useInfiniteFlat<T>(
    query: UseInfiniteQueryResult<InfiniteData<PaginatedRes<T>>>,
    reverse = true,
) {
    const itemsFlat = useMemo(() => {
        const flat = query.data?.pages.flatMap((p) => p.results) ?? [];
        return reverse ? flat.slice().reverse() : flat;
    }, [query.data, reverse]);

    return { ...query, itemsFlat };
}
